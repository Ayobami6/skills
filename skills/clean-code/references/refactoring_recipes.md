# Refactoring Recipes & Code Smells Catalog

Refactoring is the systematic process of improving the internal structure of existing code without altering its external observable behavior.

---

## 1. Top Code Smells & Remediation

| Code Smell | Symptoms | Refactoring Recipe |
| :--- | :--- | :--- |
| **God Class / Bloated Module** | Class > 300 lines with dozens of mixed concerns. | **Extract Class / Submodule**: Group related methods and fields into focused cohesive classes. |
| **Long Method / Function** | Function doing parsing, validation, database access, and logging. | **Extract Method / Function**: Break down into single-purpose functions named after *what* they achieve. |
| **Primitive Obsession** | Passing raw strings, ints, or booleans for domain entities (e.g. `zipCode: string`, `currency: string`). | **Introduce Value Object**: Wrap with typed entities (e.g., `class PostalCode`, `class Currency`). |
| **Feature Envy** | Method in Class A repeatedly invokes getters/fields on Class B. | **Move Method**: Move the method to Class B where the underlying data lives. |
| **Shotgun Surgery** | A single change requires small tweaks in 10 different files. | **Move Field/Method**: Consolidate scattered logic into a single cohesive domain entity. |
| **Data Clumps** | The same 3-4 parameters appear together across multiple functions (`x, y, width, height`). | **Introduce Parameter Object / Struct**: Bundle them into a cohesive record. |

---

## 2. Refactoring Recipes in Practice

### Recipe A: Replace Primitive Obsession with Value Objects

#### Before
```typescript
function registerUser(email: string, age: number) {
  if (!email.includes('@') || !email.includes('.')) {
    throw new Error('Invalid email');
  }
  if (age < 18 || age > 120) {
    throw new Error('Age must be between 18 and 120');
  }
  // ...
}
```

#### After
```typescript
export class EmailAddress {
  private constructor(private readonly value: string) {}

  static create(raw: string): EmailAddress {
    const trimmed = raw.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      throw new Error(`Invalid email address: ${raw}`);
    }
    return new EmailAddress(trimmed);
  }

  toString(): string {
    return this.value;
  }
}

export class Age {
  private constructor(private readonly value: number) {}

  static create(raw: number): Age {
    if (!Number.isInteger(raw) || raw < 18 || raw > 120) {
      throw new Error(`Invalid adult age: ${raw}`);
    }
    return new Age(raw);
  }

  toNumber(): number {
    return this.value;
  }
}

function registerUser(email: EmailAddress, age: Age) {
  // Types guarantee validation has already occurred
}
```

---

### Recipe B: Replace Conditional Switch with Polymorphism / Strategy

#### Before
```python
def calculate_discount(customer_type: str, amount: float) -> float:
    if customer_type == "regular":
        return amount * 0.05
    elif customer_type == "premium":
        return amount * 0.15
    elif customer_type == "vip":
        return amount * 0.25
    elif customer_type == "employee":
        return amount * 0.50
    else:
        return 0.0
```

#### After
```python
from typing import Protocol

class DiscountPolicy(Protocol):
    def apply_discount(self, amount: float) -> float:
        ...

class RegularDiscount:
    def apply_discount(self, amount: float) -> float:
        return amount * 0.05

class VIPDiscount:
    def apply_discount(self, amount: float) -> float:
        return amount * 0.25

class EmployeeDiscount:
    def apply_discount(self, amount: float) -> float:
        return amount * 0.50

DISCOUNT_POLICIES: dict[str, DiscountPolicy] = {
    "regular": RegularDiscount(),
    "vip": VIPDiscount(),
    "employee": EmployeeDiscount(),
}

def calculate_discount(customer_type: str, amount: float) -> float:
    policy = DISCOUNT_POLICIES.get(customer_type)
    return policy.apply_discount(amount) if policy else 0.0
```

---

## 3. Safe Refactoring Protocol

1. **Verify Baseline Tests**: Ensure all existing tests pass before touching any code.
2. **Take Small Steps**: Make one atomic refactoring transformation at a time.
3. **Run Tests After Each Step**: Catch regressions immediately.
4. **Preserve External Interfaces**: If deprecating an old method, forward it to the new implementation before full removal.

