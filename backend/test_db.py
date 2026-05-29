from sqlalchemy import create_engine


DATABASE_URL='postgresql+psycopg2://neondb_owner:npg_TmiRPKCs0Xz9@ep-noisy-wave-aqp6lkv9-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
engine = create_engine(DATABASE_URL)

try:
    conn = engine.connect()
    print("CONNECTED SUCCESSFULLY")
    conn.close()

except Exception as e:
    print(e)