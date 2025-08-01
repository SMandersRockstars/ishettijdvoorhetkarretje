FROM nginx:alpine

# Copy the src directory to the Nginx default HTML directory
COPY src/ /usr/share/nginx/html/

# Expose port 80 for HTTP traffic
EXPOSE 80

# Start the Nginx server
CMD ["nginx", "-g", "daemon off;"]
