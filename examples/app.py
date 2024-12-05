from difflib import context_diff
from nl4dv import NL4DV
import os
import json
from flask import Flask, jsonify, request, Blueprint, render_template, abort, send_from_directory
from jinja2 import TemplateNotFound
# draco
from draco import vl2asp, asp2vl, run_clingo, data2schema
import pandas as pd

# Import our Example Applications
from applications.datatone import datatone_routes
from applications.vleditor import vleditor_routes
from applications.vllearner import vllearner_routes
from applications.mmplot import mmplot_routes
from applications.mindmap import mindmap_routes
from applications.chatbot import chatbot_routes
from applications.nl4dv_llm import nl4dv_llm_routes

# Import our Debugging Applications
from debuggers.debugger_single import debugger_single_routes
from debuggers.debugger_batch import debugger_batch_routes
from debuggers.vis_matrix import vis_matrix_routes
from debuggers.test_queries import test_queries_routes

# Initialize the app
app = Flask(__name__)

# Initialize nl4dv variable
nl4dv_instance = None

def get_dataset_meta():
    global nl4dv_instance
    dataset_meta = nl4dv_instance.get_metadata()
    output = {
        "summary": dataset_meta,
        "rowCount": nl4dv_instance.data_genie_instance.rows,
        "columnCount": len(dataset_meta.keys())
    }
    return jsonify(output)

def process_clingo_output(raw_response):
#     # Implement parsing logic based on Clingo's output format
    try:
        # Example: Parse JSON-like responses
        parsed_response = json.loads(raw_response)
        alternatives = parsed_response.get("alternatives", [])
        return alternatives
    except json.JSONDecodeError:
        raise ValueError("Failed to parse Clingo output. Ensure it is valid JSON.")

# @app.route('/init', methods=['POST'])
# def init():
#     global nl4dv_instance

#     if 'processing_mode' not in request.form:
#         request.form['processing_mode'] = 'semantic-parsing'

#     processing_mode = request.form['processing_mode']
#     if processing_mode == "gpt":
#             openai_key = request.form['openAIKey']
#             nl4dv_instance = NL4DV(processing_mode="gpt", gpt_api_key=openai_key, verbose=True)

#     elif processing_mode == "semantic-parsing":
#         dependency_parser = request.form['dependency_parser']
#         if dependency_parser == "corenlp":
#             dependency_parser_config = {'name': 'corenlp','model': os.path.join("assets","jars","stanford-english-corenlp-2018-10-05-models.jar"),'parser': os.path.join("assets","jars","stanford-parser.jar")}
#             nl4dv_instance = NL4DV(dependency_parser_config=dependency_parser_config, verbose=True, processing_mode="semantic-parsing")

#         elif dependency_parser == "spacy":
#             dependency_parser_config = {'name': 'spacy','model': 'en_core_web_sm','parser': None}
#             nl4dv_instance = NL4DV(dependency_parser_config=dependency_parser_config, verbose=True, processing_mode="semantic-parsing")

#         elif dependency_parser == "corenlp-server":
#             dependency_parser_config = {'name': 'corenlp-server','url': 'http://localhost:9000'}
#             nl4dv_instance = NL4DV(dependency_parser_config=dependency_parser_config, verbose=True, processing_mode="semantic-parsing")

#         else:
#             raise ValueError('Error with Dependency Parser')
#     else:
#         raise ValueError('Error with Processing Mode')

#     return jsonify({"message":"NL4DV Initialized"})


# Modified version
@app.route('/init', methods=['POST'])
def init():
    global nl4dv_instance

    # Create a mutable copy of request.form
    form_data = request.form.to_dict()

    # Ensure processing_mode is set
    if 'processing_mode' not in form_data:
        form_data['processing_mode'] = 'semantic-parsing'

    processing_mode = form_data['processing_mode']
    
    if processing_mode == "gpt":
        openai_key = form_data['openAIKey']
        nl4dv_instance = NL4DV(processing_mode="gpt", gpt_api_key=openai_key, verbose=True)

    elif processing_mode == "semantic-parsing":
        dependency_parser = form_data['dependency_parser']
        if dependency_parser == "corenlp":
            dependency_parser_config = {
                'name': 'corenlp',
                'model': os.path.join("assets", "jars", "stanford-english-corenlp-2018-10-05-models.jar"),
                'parser': os.path.join("assets", "jars", "stanford-parser.jar")
            }
            nl4dv_instance = NL4DV(dependency_parser_config=dependency_parser_config, verbose=True, processing_mode="semantic-parsing")

        elif dependency_parser == "spacy":
            dependency_parser_config = {
                'name': 'spacy',
                'model': 'en_core_web_sm',
                'parser': None
            }
            nl4dv_instance = NL4DV(dependency_parser_config=dependency_parser_config, verbose=True, processing_mode="semantic-parsing")

        elif dependency_parser == "corenlp-server":
            dependency_parser_config = {
                'name': 'corenlp-server',
                'url': 'http://localhost:9000'
            }
            nl4dv_instance = NL4DV(dependency_parser_config=dependency_parser_config, verbose=True, processing_mode="semantic-parsing")
        else:
            raise ValueError('Error with Dependency Parser')
    else:
        raise ValueError('Error with Processing Mode')

    return jsonify({"message": "NL4DV Initialized"})



@app.route('/setDependencyParser', methods=['POST'])
def setDependencyParser():
    global nl4dv_instance
    if nl4dv_instance is None:
        return jsonify({"message":"NL4DV NOT initialized"})

    dependency_parser = request.form['dependency_parser']
    if dependency_parser == "corenlp":
        dependency_parser_config = {'name': 'corenlp','model': os.path.join("assets","jars","stanford-english-corenlp-2018-10-05-models.jar"),'parser': os.path.join("assets","jars","stanford-parser.jar")}
        nl4dv_instance.set_dependency_parser(config=dependency_parser_config)

    elif dependency_parser == "spacy":
        dependency_parser_config = {'name': 'spacy','model': 'en_core_web_sm','parser': None}
        nl4dv_instance.set_dependency_parser(config=dependency_parser_config)

    elif dependency_parser == "corenlp-server":
        dependency_parser_config = {'name': 'corenlp-server','url': 'http://localhost:9000'}
        nl4dv_instance.set_dependency_parser(config=dependency_parser_config)
    else:
        raise ValueError('Data not provided')


@app.route('/setData', methods=['POST'])
def setData():
    global nl4dv_instance
    if nl4dv_instance is None:
        return jsonify({"message":"NL4DV NOT initialized"})

    dataset = request.form['dataset']
    if dataset is not None:
        datafile_obj = dataset.rsplit(".")
        nl4dv_instance.set_data(data_url=os.path.join("assets", "data", datafile_obj[0] + ".csv"))
        nl4dv_instance.set_alias_map(alias_url=os.path.join("assets", "aliases", datafile_obj[0] + ".json"))
        return get_dataset_meta()
    else:
        raise ValueError('Data not provided')

@app.route('/setIgnoreList', methods=['POST'])
def setIgnoreList():
    global nl4dv_instance
    if nl4dv_instance is None:
        return jsonify({"message":"NL4DV NOT initialized"})

    ignore_words = request.form['ignore_words']
    nl4dv_instance.set_ignore_words(ignore_words=json.loads(ignore_words))
    return jsonify({'message': 'Ignore List Set successfully'})


@app.route('/setThresholds', methods=['POST'])
def setThresholds():
    global nl4dv_instance
    if nl4dv_instance is None:
        return jsonify({"message":"NL4DV NOT initialized"})

    thresholds_str = request.form['thresholds']
    try:
        thresholds = json.loads(thresholds_str)
        response = nl4dv_instance.set_thresholds(thresholds)
        return jsonify({'message': 'Thresholds Set successfully'})
    except:
        raise ValueError('Thresholds not a JSON string')


@app.route('/setImportanceScores', methods=['POST'])
def setImportanceScores():
    global nl4dv_instance
    if nl4dv_instance is None:
        return jsonify({"message":"NL4DV NOT initialized"})

    scores_str = request.form['importance_scores']
    try:
        scores = json.loads(scores_str)
        response = nl4dv_instance.set_importance_scores(scores)
        return jsonify({'message': 'Scores Set successfully'})

    except Exception:
        raise ValueError('Importance Scores not a JSON string')


@app.route('/update_query', methods=['POST'])
def update_query():
    global nl4dv_instance
    if nl4dv_instance is None:
        return jsonify({"message":"NL4DV NOT initialized"})

    ambiguity_obj = request.get_json()
    return json.dumps(nl4dv_instance.update_query(ambiguity_obj))


@app.route('/analyze_query', methods=['POST'])
def analyze_query():
    global nl4dv_instance
    if nl4dv_instance is None:
        return jsonify({"message":"NL4DV NOT initialized"})

    query = request.form['query']
    # print(request.form['dialog'])
    dialog = True if 'dialog' in request.form and request.form['dialog'] == 'true' else False
    if 'dialog' in request.form and request.form['dialog'] == "auto":
        dialog = "auto"

    if dialog is True:
        dialog_id = request.form['dialog_id']
        query_id = int(request.form['query_id'])

        return json.dumps(nl4dv_instance.analyze_query(query, dialog=dialog, dialog_id=dialog_id, query_id=query_id, debug=True))

    if dialog == "auto":
        return json.dumps(nl4dv_instance.analyze_query(query, dialog=dialog, debug=True))

    return json.dumps(nl4dv_instance.analyze_query(query, debug=True))


def convert_data_url_to_values(vl_spec, csv_file_path):
    try:
        # Load the CSV file
        data = pd.read_csv(csv_file_path)

        # Convert to inline data
        inline_data = data.to_dict(orient="records")

        # Replace `data.url` with `data.values`
        vl_spec["data"] = {"values": inline_data}
        return vl_spec
    except Exception as e:
        raise ValueError(f"Error processing data file {csv_file_path}: {str(e)}")

# Draco's alternative generation - v8
@app.route('/generate_alternatives', methods=['POST'])
def generate_alternatives():
    try:
        # Get the Vega-Lite spec from the request
        vl_spec = request.form.get('vl_spec')
        if not vl_spec:
            return jsonify({"error": "Missing vl_spec"}), 400

        # Parse the spec
        vl_spec = json.loads(vl_spec)

        # Convert `data.url` to `data.values` if necessary
        if "data" in vl_spec and "url" in vl_spec["data"]:
            csv_file_path = os.path.join("assets", "data", vl_spec["data"]["url"].split("/")[-1])  # Extract the file name from URL
            vl_spec = convert_data_url_to_values(vl_spec, csv_file_path)

        # Generate ASP rules
        asp_rules = vl2asp(vl_spec)
        schema_rules = data2schema(csv_file_path)
        full_asp = asp_rules + schema_rules

        # Run Clingo and get alternatives
        raw_response = run_clingo(full_asp)

        if isinstance(raw_response, bytes):
            raw_response = raw_response.decode("utf-8")  # Decode bytes to string

        # Parse the Clingo output
        alternatives = process_clingo_output(raw_response)

        # Return updated spec and alternatives
        return jsonify({"updated_vl_spec": vl_spec, "alternatives": alternatives}), 200

    except Exception as e:
        app.logger.error(f"Error in /generate_alternatives: {e}")
        return jsonify({"error": str(e)}), 500



# get data and be prepared for Draco
@app.route('/get_csv_data', methods=['POST'])
def get_csv_data():
    try:
        file_url = request.form.get('url')
        if not file_url:
            return jsonify({"error": "Missing file URL"}), 400

        csv_file_path = os.path.join("assets", "data", file_url.split("/")[-1])  # Extract file name
        data = pd.read_csv(csv_file_path)
        return jsonify(data.to_dict(orient="records")), 200

    except Exception as e:
        app.logger.error(f"Error fetching CSV data: {e}")
        return jsonify({"error": str(e)}), 500


# convert data to ASP schema
# @app.route('/convert_to_asp', methods=['POST'])
# def convert_to_asp():
#     try:
#         # Get the Vega-Lite spec from the request
#         vl_spec = request.json.get("vl_spec")
#         if not vl_spec:
#             return jsonify({"error": "Missing Vega-Lite spec"}), 400
#         # Convert Vega-Lite spec to ASP rules
#         asp_rules = vl2asp(vl_spec)
#         # Return the ASP rules
#         return jsonify({"asp_rules": asp_rules}), 200
#     except Exception as e:
#         app.logger.error(f"Error converting to ASP: {e}")
#         return jsonify({"error": str(e)}), 500

@app.route('/convert_to_asp', methods=['POST'])
def convert_to_asp():
    try:
        vl_spec = request.json.get("vl_spec")
        if not vl_spec:
            return jsonify({"error": "Missing Vega-Lite spec"}), 400
        
        asp_rules = vl2asp(vl_spec)  # Draco conversion
        return jsonify({"asp_rules": asp_rules}), 200
    except Exception as e:
        app.logger.error(f"Error converting to ASP: {e}")
        return jsonify({"error": str(e)}), 500



@app.route('/flushConversation', methods=['POST'])
def flushConversation():
    global nl4dv_instance
    if nl4dv_instance is None:
        return jsonify({"message":"NL4DV NOT initialized"})

    query_id = request.form['query_id']
    dialog_id = request.form['dialog_id']
    try:
        nl4dv_instance.delete_dialogs(dialog_id=dialog_id, query_id=query_id)
    except Exception as e:
        return jsonify({"message": "Some error occurred flushing the conversation."})
    return jsonify({"message": "Conversation flushed."})


@app.route('/flushAllConversations', methods=['POST'])
def flushAllConversations():
    global nl4dv_instance
    if nl4dv_instance is None:
        return jsonify({"message":"NL4DV NOT initialized"})

    try:
        nl4dv_instance.delete_dialogs(dialog_id=None, query_id=None)
    except Exception as e:
        return jsonify({"message": "Some error occurred flushing all conversations."})
    return jsonify({"message": "All conversations flushed."})

@app.route('/setAttributeDataType', methods=['POST'])
def setAttributeDataType():
    global nl4dv_instance
    if nl4dv_instance is None:
        return jsonify({"message":"NL4DV NOT initialized"})

    attr_type_obj = request.form['attr_type_obj']
    nl4dv_instance.set_attribute_datatype(json.loads(attr_type_obj))
    return get_dataset_meta()


@app.route('/',methods=['GET'])
def application_homepage():
    try:
        return render_template('index-backup.html')
    except TemplateNotFound:
        abort(404)


if __name__ == "__main__":
    # app.register_blueprint(datatone_routes.datatone_bp, url_prefix='/datatone')
    # app.register_blueprint(vleditor_routes.vleditor_bp, url_prefix='/vleditor')
    # app.register_blueprint(vllearner_routes.vllearner_bp, url_prefix='/vllearner')
    # app.register_blueprint(mmplot_routes.mmplot_bp, url_prefix='/mmplot')
    app.register_blueprint(mindmap_routes.mindmap_bp, url_prefix='/mindmap')
    # app.register_blueprint(chatbot_routes.chatbot_bp, url_prefix='/chatbot')
    # app.register_blueprint(nl4dv_llm_routes.nl4dv_llm_bp, url_prefix='/nl4dv_llm')

    # app.register_blueprint(debugger_single_routes.debugger_single_bp, url_prefix='/debugger_single')
    # app.register_blueprint(debugger_batch_routes.debugger_batch_bp, url_prefix='/debugger_batch')
    # app.register_blueprint(vis_matrix_routes.vis_matrix_bp, url_prefix='/vis_matrix')
    # app.register_blueprint(test_queries_routes.test_queries_bp, url_prefix='/test_queries')

    port = int(os.environ.get("PORT", 7001))
    app.run(host='0.0.0.0', debug=True, threaded=True, port=port)
