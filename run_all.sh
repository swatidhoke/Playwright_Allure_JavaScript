#!/bin/bash
set -e

# 1) Run tests
npm test

# 2) Generate and open Allure report
npm run report:allure:generate
npm run report:allure:open

# (Optional) Or serve directly
#npm run report:allure:serve
# End of script