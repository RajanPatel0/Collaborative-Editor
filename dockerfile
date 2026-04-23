#Build the frontend [dist folder]
#Copy the built frontend files to the backend's public directory

FROM node:20-alpine AS frontend-builder

COPY ./frontend /app

WORKDIR /app

RUN npm install

RUN npm run build


#Build the backend and serve the frontend files

FROM node:20-alpine

COPY ./backend /app

WORKDIR /app

RUN npm install

COPY --from=frontend-builder /app/dist /app/public

CMD ["node", "server.js"]