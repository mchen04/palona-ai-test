#!/bin/bash

# Export the environment variables from .env.local
export $(cat ../\
.env.local | grep -v '^#' | xargs)

# Run the test
npx tsx testDirectChat.ts