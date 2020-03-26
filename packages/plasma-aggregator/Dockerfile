FROM node:10.18.1
WORKDIR /HOME

# start aggregator process
WORKDIR /HOME/aggregator
COPY . .
RUN npm i
RUN npm run build

CMD npm start
