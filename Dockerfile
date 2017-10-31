# documentation at https://nodejs.org/en/docs/guides/nodejs-docker-webapp/

# Using newer, minimal node baseimage
FROM node:8-alpine

# Install dependencies 
WORKDIR /usr/src/app
COPY package.json .
RUN npm install

# Copy application files
COPY . .

# Expose port and set start cmd
EXPOSE 8888
CMD [ "npm", "start" ]
