FROM nginx:alpine
COPY . /usr/share/nginx/html/
# Serve the app at the root URL; keep the original filename working too.
RUN cp "/usr/share/nginx/html/Dry Utility App.html" /usr/share/nginx/html/index.html
