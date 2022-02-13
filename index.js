const express = require('express');
const http = require('http');
const hbs = require('hbs');
const { parse } = require('cookie');
const uuid = require('uuid').v4;
const dayjs = require('dayjs');

const app = express();
const server = http.createServer(app);

const { Server } = require('socket.io');

const io = new Server(server);

const db = require('./db/db');
const { colors } = require('./node_utils/constants');
const { getRoomIdFromURL } = require('./node_utils/get-room-id');
const { methods } = require('./node_utils/middlewares/methods');

process.title = 'Shared Canvas';
const port = process.env.port || 3000;

// app.use(methods);

app.set('view engine', 'html');
app.engine('html', hbs.__express);

app.set('views', `${__dirname}/dist`);

app.get('/status', (req, res) => {
  res.sendStatus(200);
});

app.use(express.static('dist'));

app.get('/', async (req, res) => {
  console.log(1111111, '\n\n\n\n\n\n', req.headers.cookies);
  // const cookies = parse(req.headers.cookies);
  // const roomUuid = getRoomIdFromURL(req.url);

  // if (!cookies?.userUuid) {
  //   const userUuid = uuid();
  //   res.cookie('userUuid', userUuid, {
  //     secure: true,
  //     httpOnly: true,
  //     expires: dayjs().add(30, 'days').toDate(),
  //   });

  //   await db('users').insert({ uuid: userUuid }).onConflict('uuid').merge();
  //   await db('drawing_room').insert({ uuid: roomUuid }).onConflict('uuid').merge();
  // }

  res.render('index', { colors });
});

const getAllArt = async ({ userUuid, roomUuid }) => {
  let results = await db('canvas_entries')
    .select(['image', 'user_uuid', 'uuid'])
    .where({ room_uuid: roomUuid, user_uuid: userUuid });

  let myResult = null;
  if (userUuid) {
    myResult = results.find((r) => r.user_uuid === userUuid);
    results = results
      .filter((r) => r.user_uuid !== userUuid)
      .map((res) => ({
        id: res.uuid,
        image: res.image,
      }));
  }
  return [results, myResult?.image];
};

// io.on('connection', async (socket) => {
//   const ip = socket.conn.remoteAddress;
//   const roomUuid = getRoomIdFromURL(socket.handshake.headers.referer);

//   const cookies = parse(socket.handshake.headers.cookies);
//   const userUuid = cookies?.userUuid;

//   const dbQueryParams = { user_uuid: userUuid, room_uuid: roomUuid };
//   const dbQueryFields = ['user_uuid', 'room_uuid'];

//   const log = (...messages) => {
//     // eslint-disable-next-line no-console
//     console.info(`[IP: ${ip}]: `, dbQueryParams, ...messages);
//   };
//   log('A user connected.', roomUuid);

//   socket.emit('client-connection', io.engine.clientsCount);
//   socket.broadcast.emit('client-connection', io.engine.clientsCount);

//   // Upsert a new entry for current user, and get the uuid back
//   await db('canvas_entries')
//     .insert(dbQueryParams)
//     .onConflict(dbQueryFields)
//     .merge();

//   // eslint-disable-next-line no-console
//   console.info(dbQueryParams);

//   const [allArt, myArt] = await getAllArt({ userUuid, roomUuid });
//   socket.emit('image', allArt, myArt, uuid);

//   socket.on('clear-image', async (cb) => {
//     log('A user cleared image.');
//     await db('canvas_entries')
//       .where(dbQueryParams)
//       .update({ image: Buffer.from([]) });

//     socket.broadcast.emit('image-clear', uuid);
//     cb({ status: 'ok' });
//   });

//   socket.on('image', async (points, cb) => {
//     let { image } = await db('canvas_entries')
//       .select('image')
//       .where(dbQueryParams)
//       .first();

//     if (!image) image = Buffer.from([]);

//     const pointsBuf = Buffer.concat([image, points]);

//     await db('canvas_entries').where(dbQueryParams).update({ image: pointsBuf });

//     socket.broadcast.emit('image-update', uuid, points);
//     cb({ status: 'ok' });
//   });

//   socket.on('disconnect', () => {
//     log('A user disconnected.');
//     socket.broadcast.emit('client-connection', io.engine.clientsCount);
//   });
// });

server.listen(port, '0.0.0.0', () => {
  // eslint-disable-next-line no-console
  console.info(`[Shared Canvas] App listening at http://localhost:${port}`);
});
