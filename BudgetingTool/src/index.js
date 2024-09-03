const { hexToString, stringToHex } = require("viem");

const rollup_server = process.env.ROLLUP_HTTP_SERVER_URL;
console.log("HTTP rollup_server url is " + rollup_server);

let budgets = {};

function createBudget(userId, income, categories) {
  const totalAllocated = Object.values(categories).reduce((sum, value) => sum + value, 0);

  if (totalAllocated > income) {
    throw new Error("Total allocated amount exceeds income");
  }

  const unallocated = income - totalAllocated;

  budgets[userId] = {
    income,
    categories,
    unallocated
  };

  return {
    message: "Budget created successfully",
    unallocated: unallocated.toFixed(2)
  };
}

function getBudget(userId) {
  if (!budgets[userId]) {
    throw new Error("Budget not found for this user");
  }
  return budgets[userId];
}

function updateBudgetCategory(userId, category, amount) {
  if (!budgets[userId]) {
    throw new Error("Budget not found for this user");
  }

  const budget = budgets[userId];
  const oldAmount = budget.categories[category] || 0;
  const difference = amount - oldAmount;

  if (difference > budget.unallocated) {
    throw new Error("Not enough unallocated funds for this update");
  }

  budget.categories[category] = amount;
  budget.unallocated -= difference;

  return {
    message: "Category updated successfully",
    updatedCategory: category,
    newAmount: amount,
    newUnallocated: budget.unallocated.toFixed(2)
  };
}

async function handle_advance(data) {
  console.log("Received advance request data " + JSON.stringify(data));
  const payloadString = hexToString(data.payload);
  console.log(`Converted payload: ${payloadString}`);

  try {
    const payload = JSON.parse(payloadString);
    let result;

    switch (payload.action) {
      case "createBudget":
        result = createBudget(payload.userId, payload.income, payload.categories);
        break;
      case "getBudget":
        result = getBudget(payload.userId);
        break;
      case "updateCategory":
        result = updateBudgetCategory(payload.userId, payload.category, payload.amount);
        break;
      default:
        throw new Error("Invalid action");
    }

    const outputStr = stringToHex(JSON.stringify(result));

    await fetch(rollup_server + "/notice", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ payload: outputStr }),
    });
  } catch (error) {
    console.error("Error processing request:", error);
    const errorStr = stringToHex(JSON.stringify({ error: error.message }));
    await fetch(rollup_server + "/notice", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ payload: errorStr }),
    });
  }
  return "accept";
}

async function handle_inspect(data) {
  console.log("Received inspect request data " + JSON.stringify(data));
  const route = hexToString(data.payload);
  console.log(`Converted route: ${route}`);

  try {
    let result;
    if (route === "listAllBudgets") {
      result = budgets;
    } else if (route.startsWith("getBudgetDetails/")) {
      const userId = route.split("/")[1];
      if (!userId) {
        throw new Error("User ID is required");
      }
      result = getBudget(userId);
    } else {
      throw new Error("Invalid route for inspection");
    }

    const outputStr = stringToHex(JSON.stringify(result));
    await fetch(rollup_server + "/report", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ payload: outputStr }),
    });
  } catch (error) {
    console.error("Error processing inspection request:", error);
    const errorStr = stringToHex(JSON.stringify({ error: error.message }));
    await fetch(rollup_server + "/report", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ payload: errorStr }),
    });
  }
  return "accept";
}

var handlers = {
  advance_state: handle_advance,
  inspect_state: handle_inspect,
};

var finish = { status: "accept" };

(async () => {
  while (true) {
    const finish_req = await fetch(rollup_server + "/finish", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "accept" }),
    });

    console.log("Received finish status " + finish_req.status);

    if (finish_req.status == 202) {
      console.log("No pending rollup request, trying again");
    } else {
      const rollup_req = await finish_req.json();
      var handler = handlers[rollup_req["request_type"]];
      finish["status"] = await handler(rollup_req["data"]);
    }
  }
})();