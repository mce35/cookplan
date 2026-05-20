# Stage 1: Build the Angular application
FROM node:22 as build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Stage 2: Serve the application with Nginx
FROM nginx:alpine

# Copy the build output from the build stage to the nginx html directory
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html

# Copy a custom nginx configuration to handle Angular routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
