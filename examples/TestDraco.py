

from draco import vl2asp, run_clingo
import json

# Vega-Lite specification
vega_lite_spec = {
    "mark": "bar",
    "data": {
        "values": [
            {"Category": "A", "Count": 10},
            {"Category": "B", "Count": 20}
        ]
    },
    "encoding": {
        "x": {"field": "Category", "type": "nominal"},
        "y": {"field": "Count", "type": "quantitative"}
    }
}


# Convert Vega-Lite spec to ASP
asp_rules = vl2asp(vega_lite_spec)
print("Vega-Lite ASP Rules:")
print("\n".join(asp_rules))

# Data schema
data_schema = """
field("Category").
field_type("Category", nominal).

field("Count").
field_type("Count", quantitative).
"""
data_schema_list = [line.strip() for line in data_schema.strip().split("\n") if line.strip()]

# Combine ASP rules
full_asp = asp_rules + data_schema_list

# Print the full ASP rules for debugging
print("\nFull ASP Rules:\n")
print("\n".join(full_asp))