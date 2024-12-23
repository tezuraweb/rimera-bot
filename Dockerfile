# Use Node.js LTS version
FROM node:20-slim

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci

# Bundle app source
COPY . .

# Create directory for static files if it doesn't exist
RUN mkdir -p static/dist

# Build the application (assuming you have a build script)
RUN npm run build

# Your app binds to port 3000 (adjust if needed)
EXPOSE 3000

# Start the application
CMD [ "node", "app.js" ]