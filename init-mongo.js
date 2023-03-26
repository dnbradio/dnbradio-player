db.createUser(
  {
    user: $ENV_MONGO_INITDB_ROOT_USERNAME,
    pwd: $ENV_MONGO_INITDB_ROOT_PASSWORD,
    roles: [
      {
        role: 'readWrite',
        db: $ENV_MONGO_INITDB_DATABASE
      }
    ]
  }
)