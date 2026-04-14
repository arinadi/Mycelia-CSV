#!/usr/bin/env python3
import csv
import json
import random
import argparse
from datetime import datetime, timedelta

def php_serialize(data):
    """
    A lightweight, dependency-free PHP serializer for Python types.
    Supports: int, float, str, bool, list (indexed array), dict (associative array), None.
    """
    if data is None:
        return "N;"
    elif isinstance(data, bool):
        return f"b:{1 if data else 0};"
    elif isinstance(data, int):
        return f"i:{data};"
    elif isinstance(data, float):
        # Format float to avoid too many decimals if possible
        return f"d:{round(data, 10)};"
    elif isinstance(data, str):
        # PHP counts bytes, but for standard chars len() matches bytes
        return f's:{len(data.encode("utf-8"))}:"{data}";'
    elif isinstance(data, list):
        # Indexed array
        parts = []
        for i, v in enumerate(data):
            parts.append(f"i:{i};")
            parts.append(php_serialize(v))
        return f'a:{len(data)}:{{{ "".join(parts) }}}'
    elif isinstance(data, dict):
        # Associative array
        parts = []
        for k, v in data.items():
            # Key can be int or string
            if isinstance(k, int):
                parts.append(f"i:{k};")
            else:
                parts.append(f's:{len(str(k).encode("utf-8"))}:"{k}";')
            parts.append(php_serialize(v))
        return f'a:{len(data)}:{{{ "".join(parts) }}}'
    return "N;"

def generate_row(row_id):
    sources = ["app-v3", "auth-api", "main-db", "payment-gateway", "iot-node", "social-api", "worker-pool", "cdn-edge"]
    categories = ["settings", "log", "audit", "transaction", "telemetry", "analytics", "cache"]
    statuses = ["active", "critical", "success", "pending", "ok", "info", "warning"]
    
    source = random.choice(sources)
    category = random.choice(categories)
    status = random.choice(statuses)
    
    # Patterns
    patterns = [
        # Settings Pattern
        lambda: {
            "settings": {"theme": random.choice(["dark", "light", "system"]), "lang": random.choice(["id-ID", "en-US", "ja-JP"]), "zoom": random.randint(80, 150)},
            "features": {"ai": random.choice([True, False]), "beta": random.choice([True, False])},
            "last_updated": random.randint(1700000000, 1713000000)
        },
        # Log Pattern
        lambda: {
            "log": {"id": f"LOG-{random.randint(1000, 9999)}", "lvl": random.choice(["INFO", "WARN", "ERROR", "FATAL"])},
            "request": {"method": random.choice(["GET", "POST", "PUT", "DELETE"]), "path": f"/api/v1/{random.choice(['users', 'items', 'sync', 'auth'])}"},
            "ip": f"192.168.1.{random.randint(2, 254)}"
        },
        # Transaction Pattern
        lambda: {
            "tx": {"id": f"TX-{random.randint(10000,99999)}", "items": [{"sku": f"ITEM-{random.randint(10,99)}", "qty": random.randint(1,5)} for _ in range(random.randint(1,3))]},
            "billing": {"total": random.randint(1000, 500000), "cur": "IDR", "gateway": random.choice(["midtrans", "stripe", "paypal"])}
        },
        # Analytics Pattern
        lambda: {
            "metrics": {"views": random.randint(10, 10000), "engagement": round(random.uniform(0.1, 5.0), 2)},
            "segment": {"region": random.choice(["Jakarta", "Surabaya", "Bandung", "Medan"]), "device": random.choice(["mobile", "desktop", "tablet"])}
        }
    ]
    
    data_dict = random.choice(patterns)()
    
    return {
        "id": row_id,
        "created_at": (datetime.now() - timedelta(days=random.randint(0, 30))).isoformat() + "Z",
        "source": source,
        "category": category,
        "status": status,
        "complex_json": json.dumps(data_dict),
        "complex_serialized": php_serialize(data_dict)
    }

def main():
    parser = argparse.ArgumentParser(description="Generate synthetic test data for Mycelia CSV.")
    parser.add_argument("--rows", type=int, default=10, help="Number of rows to generate (default: 10)")
    parser.add_argument("--output", type=str, default="generated_test_data.csv", help="Output file name (default: generated_test_data.csv)")
    
    args = parser.parse_args()
    
    headers = ["id", "created_at", "source", "category", "status", "complex_json", "complex_serialized"]
    
    print(f"Generating {args.rows} rows to {args.output}...")
    
    with open(args.output, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=headers)
        writer.writeheader()
        
        for i in range(1, args.rows + 1):
            writer.writerow(generate_row(i))
            
    print("Done! Data generated successfully.")

if __name__ == "__main__":
    main()
