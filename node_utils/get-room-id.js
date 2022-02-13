const GLOBAL_ROOM_UUID = '0e6252b1-9986-425c-97c7-8d7d0ce7b6f5';

module.exports = {
  getRoomIdFromURL(_url) {
    const url = new URL(_url).pathname.slice(1);
    if (!url) return GLOBAL_ROOM_UUID;
    return url;
  },
};
