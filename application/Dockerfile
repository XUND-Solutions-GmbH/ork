FROM node:20.18.1 as build

WORKDIR /home/node/ork
COPY --chown=node:node . .
RUN yarn install --ignore-optional \
                 --ignore-scripts \
                 --frozen-lockfile
RUN yarn build
# Install production build, remove dev dependencies
RUN yarn install --production \
                 --ignore-optional \
                 --network-timeout 100000 \
                 --frozen-lockfile

FROM node:20.18.1

WORKDIR /home/node/ork

#Copy node_modules and package.json
COPY --from=build /home/node/ork/node_modules /home/node/ork/node_modules
COPY --from=build /home/node/ork/package.json /home/node/ork/package.json

#Copy Packages
COPY --from=build /home/node/ork/auth/dist /home/node/ork/auth/dist
COPY --from=build /home/node/ork/auth/package.json /home/node/ork/auth/package.json

COPY --from=build /home/node/ork/generic-utils/dist /home/node/ork/generic-utils/dist
COPY --from=build /home/node/ork/generic-utils/package.json /home/node/ork/generic-utils/package.json

COPY --from=build /home/node/ork/i18n/dist /home/node/ork/i18n/dist
COPY --from=build /home/node/ork/i18n/package.json /home/node/ork/i18n/package.json

COPY --from=build /home/node/ork/logger/dist /home/node/ork/logger/dist
COPY --from=build /home/node/ork/logger/package.json /home/node/ork/logger/package.json

COPY --from=build /home/node/ork/rest-core/dist /home/node/ork/rest-core/dist
COPY --from=build /home/node/ork/rest-core/package.json /home/node/ork/rest-core/package.json

COPY --from=build /home/node/ork/rest-server-express/dist /home/node/ork/rest-server-express/dist
COPY --from=build /home/node/ork/rest-server-express/package.json /home/node/ork/rest-server-expres/package.json
COPY --from=build /home/node/ork/rest-server-express/node_modules /home/node/ork/rest-server-expres/node_modules

COPY --from=build /home/node/ork/schema-validator/dist /home/node/ork/schema-validator/dist
COPY --from=build /home/node/ork/schema-validator/package.json /home/node/ork/schema-validator/package.json

COPY --from=build /home/node/ork/service-utils/dist /home/node/ork/service-utils/dist
COPY --from=build /home/node/ork/service-utils/package.json /home/node/ork/service-utils/package.json

#Copy Common
COPY --from=build /home/node/ork/common/dist /home/node/ork/common/dist
COPY --from=build /home/node/ork/common/package.json /home/node/ork/common/package.json
COPY --from=build /home/node/ork/common/node_modules /home/node/ork/common/node_modules


#Copy Backend
COPY --from=build /home/node/ork/backend/dist /home/node/ork/backend/dist
COPY --from=build /home/node/ork/backend/package.json /home/node/ork/backend/package.json
COPY --from=build /home/node/ork/backend/node_modules /home/node/ork/backend/node_modules

#Copy kube configs
COPY --chown=node kubeconfig/config-dev /home/node/.kube/config-dev

USER node

ENTRYPOINT ["node", "./backend/dist/bin/start.js"]

