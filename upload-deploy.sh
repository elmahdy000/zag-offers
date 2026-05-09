#!/bin/bash

# Script to upload deploy.sh to server and make it executable

scp deploy.sh root@72.62.27.196:/var/www/zag-offers/deploy.sh
ssh root@72.62.27.196 "chmod +x /var/www/zag-offers/deploy.sh"

echo "✅ deploy.sh uploaded and made executable on server"
