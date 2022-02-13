const express = require('express');
const http = require('http');
const hbs = require('hbs');

const app = express();
const server = http.createServer(app);

const { Server } = require('socket.io');

const io = new Server(server);

const db = require('./db/db');
const { colors } = require('./node_utils/constants');

process.title = 'Shared Canvas';
const port = process.env.port || 3000;

app.set('view engine', 'html');
app.engine('html', hbs.__express);

app.set('views', `${__dirname}/dist`);

app.get('/', async (req, res) => {
  res.render('index', { colors });
});

app.get('/status', (req, res) => {
  res.sendStatus(200);
});

app.use(express.static('dist'));

const getAllArt = async (ip) => {
  let results = await db('canvas_entries').select(['image', 'ip', 'uuid']);
  let myResult = null;
  if (ip) {
    myResult = results.find((r) => r.ip === ip);
    results = results
      .filter((r) => r.ip !== ip)
      .map((res) => ({
        id: res.uuid,
        image: res.image,
      }));
  }
  return [results, myResult?.image];
};

const log = (ip, message) => {
  // eslint-disable-next-line no-console
  console.info(`[IP: ${ip}]: ${message}`);
};

io.on('connection', async (socket) => {
  const ip = socket.conn.remoteAddress;
  log(ip, 'A user connected.');
  // const ip = "127.0.1.1";

  socket.emit('client-connection', io.engine.clientsCount);
  socket.broadcast.emit('client-connection', io.engine.clientsCount);

  const uuid = await db('canvas_entries')
    .insert({ ip })
    .onConflict('ip')
    .merge()
    .returning('uuid')
    .then((res) => res[0]);

  // eslint-disable-next-line no-console
  console.info(uuid);

  const [allArt, myArt] = await getAllArt(ip);
  socket.emit('image', allArt, myArt, uuid);

  socket.on('clear-image', async (cb) => {
    log(ip, 'A user cleared image.');
    await db('canvas_entries')
      .where({ ip })
      .update({ image: Buffer.from([]) });

    socket.broadcast.emit('image-clear', uuid);
    cb({ status: 'ok' });
  });

  socket.on('image', async (points, cb) => {
    let { image } = await db('canvas_entries')
      .select('image')
      .where({ ip })
      .first();

    if (!image) image = Buffer.from([]);

    const pointsBuf = Buffer.concat([image, points]);

    await db('canvas_entries').where({ ip }).update({ image: pointsBuf });

    socket.broadcast.emit('image-update', uuid, points);
    cb({ status: 'ok' });
  });

  socket.on('disconnect', () => {
    log(ip, 'A user disconnected.');
    socket.broadcast.emit('client-connection', io.engine.clientsCount);
  });
});

server.listen(port, '0.0.0.0', () => {
  // eslint-disable-next-line no-console
  console.info(`[Shared Canvas] App listening at http://localhost:${port}`);
});
