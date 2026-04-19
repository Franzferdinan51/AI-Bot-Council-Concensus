#!/bin/bash
# Watchdog script to keep AI Council running

PORT=3000
LOG_FILE="/tmp/council-watchdog.log"

log() {
    echo "[$(date)] $1" >> $LOG_FILE
}

log "Starting Council Watchdog"

while true; do
    # Check if port is listening
    if ss -tlnp | grep -q ":$PORT "; then
        # Check if actually responding
        if curl -s --max-time 3 http://localhost:$PORT | grep -q "Council"; then
            log "Server running OK"
        else
            log "Server not responding, restarting..."
            pkill -f "vite.*$PORT" 2>/dev/null
            sleep 2
            cd /home/duckets/AI-Bot-Council-Concensus
            npx vite --port $PORT > /tmp/council.log 2>&1 &
            log "Restarted server"
        fi
    else
        log "Port not listening, starting server..."
        cd /home/duckets/AI-Bot-Council-Concensus
        npx vite --port $PORT > /tmp/council.log 2>&1 &
        log "Started server"
    fi
    
    sleep 30
done
