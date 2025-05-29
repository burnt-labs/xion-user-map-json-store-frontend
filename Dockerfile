
#### GUIDE
#### 
## create/build the image locally
# docker build -t [some-name] .

## run the image with the environment variables
# docker run -p 3000:3000 -e NEXT_PUBLIC_TREASURY_ADDRESS="your_address" -e NEXT_PUBLIC_RPC_URL="your_url" [some-name]
# You should see this in the terminal 
# > nextjs-xion-abstraxion-examples@0.1.0 start
# > next start -H 0.0.0.0

#    ▲ Next.js 14.0.0
#    - Local:        http://localhost:3000
#    - Network:      http://0.0.0.0:3000

#  ✓ Ready in 284ms

## Now open http://localhost:3000
#### 
### GUIDE


# Use Node.js v14 or higher as specified in prerequisites
FROM node:18-alpine

# Set environment variables
# 
ENV NEXT_PUBLIC_TREASURY_ADDRESS="-add-here-your-treasury-address"
ENV NEXT_PUBLIC_CONTRACT_ADDRESS="-add-here-your-contract-address"
#
ENV NEXT_PUBLIC_RPC_URL="https://rpc.xion-testnet-2.burnt.com:443"
ENV NEXT_PUBLIC_REST_URL="https://api.xion-testnet-2.burnt.com" 


# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Build the application
RUN npm run build

# Expose the default Next.js port
EXPOSE 3000

# Start the application in production mode
CMD ["npm", "run", "start", "--", "-H", "0.0.0.0"]