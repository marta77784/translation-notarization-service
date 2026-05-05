FROM node:20-alpine

WORKDIR /app
RUN chown node:node /app
USER node

COPY --chown=node:node package.json package-lock.json* ./
RUN npm install --omit=dev && npm cache clean --force

COPY --chown=node:node src ./src

ENV NODE_ENV=production

CMD ["node", "src/index.js"]
