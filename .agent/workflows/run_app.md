---
description: Run the entire application using Docker Compose
---

# Run Application

1. **Start Docker**
   Ensure Docker Desktop is running. The agent can check this for you.
   // turbo
   ```bash
   docker info > /dev/null 2>&1 || open -a Docker
   ```

2. **Run Application**
   Start all services (Frontend, Backend, PPT Service, Database).
   // turbo
   ```bash
   docker compose up --build -d
   ```

3. **Check Logs**
   Monitor the logs to see if everything started correctly.
   ```bash
   docker compose logs -f
   ```

4. **Access Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - PPT Service: http://localhost:8000
