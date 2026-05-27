# Stage 1: Build the Angular application
FROM node:26 as build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Stage 2: Build development image for hot-reloading
FROM node:26 as development

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
CMD ["npm", "run", "start"]

EXPOSE 4200

# Stage 3: Serve the application with Nginx for production
FROM nginx:alpine as production

# Copy the build output from the build stage to the nginx html directory
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html

# Copy a custom nginx configuration to handle Angular routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
