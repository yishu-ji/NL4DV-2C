# from draco import run_clingo

# sample_vl_spec = {
#     "mark": "bar",
#     "encoding": {
#         "x": {"field": "Category", "type": "nominal"},
#         "y": {"field": "Value", "type": "quantitative"}
#     },
#     "data": {"url": "assets/data/movies-w-year.csv"}
# }

# try:
#     alternatives = run_clingo(sample_vl_spec)
#     print("Generated alternatives:", alternatives)
# except Exception as e:
#     print("Error running Draco:", e)


from draco import run_clingo, vl2asp

sample_vl_spec = {
    "mark": "bar",
    "encoding": {
        "x": {"field": "Category", "type": "nominal"},
        "y": {"field": "Value", "type": "quantitative"}
    },
    "data": {"url": "assets/data/movies-w-year.csv"}
}

try:
    # Convert to ASP
    asp_rules = vl2asp(sample_vl_spec)
    print("Generated ASP Rules:\n", asp_rules)

    # Run Clingo
    alternatives = run_clingo(asp_rules)
    print("Generated Alternatives:", alternatives)
except Exception as e:
    print("Error running Draco:", e)

