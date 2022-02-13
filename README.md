# Shared Canvas

> Hello everyone, you've been invited to vandalize this wall-space.

Shared canvas is a square canvas where you and everyone else can scribble away together.

This project has been built mostly in the native web stack (1).

TODO:

- Create a screen where you can see people's individual arts in a list.
- Create a screen where you can see a single person's art, live.
- Add a loader UI that shows how many art submissions are being loaded.

# Development

1. Ensure psql is running: `sudo service postgresql start`
2. `yarn install`
3. `yarn reset-db`
4. `yarn start`
5. Open `localhost:3000` in two different windows (or browsers, one in incognito?), and carry on!


### Notes
1. The HTML has some help from handlebars, and the CSS uses some SCSS features, and the JS is transpiled using Babel. However, basically no libraries or frameworks to actually lift the load of implementating the layouts, functionality, event handling, or lifecycles were used for the client side code.