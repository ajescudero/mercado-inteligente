#!/bin/bash
echo "Verifying DB content..." > verification_results.txt
echo "Timestamp: $(date)" >> verification_results.txt
echo "DB Size: $(ls -lh shopping-list.db | awk '{print $5}')" >> verification_results.txt
echo "--- Atomo Count ---" >> verification_results.txt
sqlite3 shopping-list.db "SELECT count(*) FROM stores WHERE name LIKE '%Atomo%' OR name LIKE '%Mill%';" >> verification_results.txt
echo "--- Leche Count ---" >> verification_results.txt
sqlite3 shopping-list.db "SELECT count(*) FROM products WHERE description LIKE '%Leche%';" >> verification_results.txt
echo "Done." >> verification_results.txt
