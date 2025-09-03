#!/bin/bash
set -e

# Terminal colors
BOLD="\033[1m"
GREEN="\033[32m"
YELLOW="\033[33m"
CYAN="\033[36m"
RESET="\033[0m"

# Spinner function
spinner() {
    local pid=$1
    local delay=0.1
    local spinstr='|/-\'
    while [ "$(ps a | awk '{print $1}' | grep $pid)" ]; do
        local temp=${spinstr#?}
        printf " [%c]  " "$spinstr"
        local spinstr=$temp${spinstr%"$temp"}
        sleep $delay
        printf "\b\b\b\b\b\b"
    done
    printf "    \b\b\b\b"
}

# Function to print big step header
print_step() {
  echo -e "\n${BOLD}${CYAN}===================================="
  echo -e " STEP $1: $2 "
  echo -e "=========================================${RESET}\n"
}

echo -e "${BOLD}${GREEN}🚀 Starting Playwright + Allure Setup${RESET}\n"

print_step 1 "Verify Node.js version"
node -v
echo -e "${GREEN}✅ Node version verified${RESET}"

print_step 2 "Initialize npm project"
npm init -y &
spinner $!
echo -e "${GREEN}✅ package.json created${RESET}"

print_step 2.1 "Set environment variables"
if [ -f ".env.example" ]; then
    cp .env.example .env &
    spinner $!
    echo -e "${GREEN}✅ .env file created from .env.example${RESET}"
else
    echo -e "${YELLOW}⚠️  .env.example not found, skipping${RESET}"
fi

print_step 3 "Install Playwright"
npm install -D @playwright/test &
spinner $!
echo -e "${GREEN}✅ Playwright installed${RESET}"

print_step 4 "Install Playwright browsers"
npx playwright install &
spinner $!
echo -e "${GREEN}✅ Browsers installed${RESET}"

print_step 5 "Install Allure Playwright reporter"
npm install -D allure-playwright &
spinner $!
echo -e "${GREEN}✅ Allure reporter installed${RESET}"

print_step 6 "Install Allure CLI (optional)"
npm install -g allure-commandline --save-dev &
spinner $!
echo -e "${GREEN}✅ Allure CLI installed${RESET}"

print_step 7 "Verify installed packages"
npm list --depth=0 &
spinner $!
echo -e "${GREEN}✅ All dependencies installed successfully!${RESET}"

echo -e "\n${BOLD}${GREEN}🎉 Setup complete!${RESET}"
echo -e "${BOLD}You can now run tests with:${RESET} npx playwright test --reporter=line,allure-playwright"
echo -e "${BOLD}Generate report:${RESET} allure generate allure-results --clean -o allure-report"
echo -e "${BOLD}Open report:${RESET} allure open allure-report"
echo -e "\nHappy Testing! 🚀"
