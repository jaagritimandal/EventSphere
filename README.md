# EventSphere 

A web-based event discovery and booking management mini-project built using **Python Flask and MongoDB Atlas**.

##  Getting Started

### 1. Clone the repository

```bash
git clone github.com/jaagritimandal/EventSphere
cd EventSphere
```

### 2. Install dependencies

Make sure Python is installed, then run:

```bash
python -m pip install flask pymongo dnspython python-dotenv
```

### 3. Configure MongoDB Atlas

Create a `.env` file in the project root directory:

```env
MONGO_URI=your_mongodb_atlas_connection_string
```

Replace the placeholder with your MongoDB Atlas connection string.

Ensure that:
- The database is named `EventSphere`.
- The collections `Events`, `Bookings`, `Reviews`, and `Users` exist and contain the required data.
- Your IP address is allowed in MongoDB Atlas Network Access.
- Your database credentials are valid.

**Note:** Never commit your `.env` file or share your database credentials.

### 4. Run the application

```bash
python app.py
```

Open the local URL displayed in the terminal, usually:

http://127.0.0.1:5000

## About the Project

EventSphere is a database mini-project that demonstrates how a modern NoSQL database can support an event discovery and booking management application.

The project uses MongoDB Atlas to store event information, user records, bookings, and reviews. Python Flask connects the database to the web interface, while HTML, CSS, and JavaScript provide the frontend.

### Key Features

- Browse events stored in MongoDB Atlas.
- Search and filter events, where implemented.
- Perform CRUD operations on database records.
- Run MongoDB queries and aggregation pipelines.
- Demonstrate integration between Flask and MongoDB.

### Tech Stack

- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Python, Flask
- **Database:** MongoDB Atlas
- **Database Driver:** PyMongo

### Project Structure

```text
EventSphere/
├── app.py
├── templates/
│   └── index.html
├── static/
│   └── style.css
├── .env                 # Local configuration; not committed
├── .gitignore
└── README.md
```

Additional files may be present depending on the implementation.

### Project Purpose

Developed as a Database Management Systems mini-project to demonstrate database modeling, sample data management, CRUD operations, MongoDB-specific queries, and a comparison between NoSQL and relational databases.

