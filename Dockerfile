FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm install

# Copy source files
COPY . .

# Create public directory if it doesn't exist
RUN mkdir -p public

# Copy fallback HTML
COPY public/preview-fallback.html public/

# Create shared directory if it doesn't exist
RUN mkdir -p ../shared

# Expose port
EXPOSE 3010

# Start preview server
CMD ["node", "server.js", "./public/example.js", "--port=3010"]
