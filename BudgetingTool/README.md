# Budget Management DApp

This decentralized application (DApp) implements a simple budget management system using Cartesi Rollups technology. Users can create budgets, allocate funds to different categories, and update their budgets.

## Features

- Create a budget with income and category allocations
- Retrieve budget details
- Update budget category allocations
- View all budgets (for inspection purposes)

## Installation

1. Clone this repository:

2. Install dependencies:
   ```
   npm install
   ```

## Running the DApp

Start the DApp using the Cartesi Rollups environment. Refer to the Cartesi documentation for detailed instructions on how to run a Rollups DApp.

## Interacting with the DApp

### Sending Inputs (Advance Requests)

1. Create a budget:

   ```json
   {
     "action": "createBudget",
     "userId": "user1",
     "income": 5000,
     "categories": {
       "housing": 1500,
       "food": 800,
       "transportation": 400
     }
   }
   ```

2. Get a budget:

   ```json
   {
     "action": "getBudget",
     "userId": "user1"
   }
   ```

3. Update a budget category:
   ```json
   {
     "action": "updateCategory",
     "userId": "user1",
     "category": "food",
     "amount": 900
   }
   ```

### Making Inspect Calls

To read the state without modifying it, use the following inspect routes:

1. Get budget details:

   ```
   getBudgetDetails/user1
   ```

2. List all budgets:
   ```
   listAllBudgets
   ```
