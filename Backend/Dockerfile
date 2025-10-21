# Start from the official PostgreSQL 15 image
FROM postgres:15

# Install the pgvector extension package
# The package name for pgvector on Debian (which the postgres image uses) 
# for version 15 is typically 'postgresql-15-pgvector'.
RUN apt-get update \
    && apt-get install -y postgresql-15-pgvector \
    && rm -rf /var/lib/apt/lists/*