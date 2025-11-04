# Start from the official PostgreSQL 15 image
FROM postgres:15

# Install the pgvector extension package
# The package name for pgvector on Debian (which the postgres image uses) 
# for version 15 is typically 'postgresql-15-pgvector'.
RUN apt-get update \
    && apt-get install -y postgresql-15-pgvector \
    && rm -rf /var/lib/apt/lists/*

# Copy the initialization script to create the extension
COPY ./init /docker-entrypoint-initdb.d

ENV TZ=Asia/Ho_Chi_Minh

# Expose the default PostgreSQL port
EXPOSE 5432