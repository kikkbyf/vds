import copy

def resolve_pydantic_schema(pydantic_model_class):
    """
    Converts a Pydantic model's JSON schema into a format compatible with Google GenAI SDK.
    Specifically, it recursively resolves `$ref` and `$defs` (or definitions), 
    producing a fully expanded standard JSON schema tree.
    """
    # 1. Get standard JSON schema from Pydantic
    schema = pydantic_model_class.model_json_schema()
    
    # 2. Extract definitions
    defs = schema.pop("$defs", {})
    if not defs:
        defs = schema.pop("definitions", {}) # Fallback for older pydantic/mix

    # 3. Recursive resolution function
    def resolve_node(node):
        if isinstance(node, dict):
            # If it's a reference, replace it with the definition
            if "$ref" in node:
                ref_path = node["$ref"]
                # Ref format is usually "#/$defs/ModelName"
                model_name = ref_path.split("/")[-1]
                if model_name in defs:
                    # Recursively resolve the definition itself before returning
                    # We use deepcopy to avoid mutating the original defs during multiple refs
                    definition = copy.deepcopy(defs[model_name])
                    return resolve_node(definition)
                else:
                    return node # warning: unresolved ref

            # Process properties if present
            new_node = {}
            for k, v in node.items():
                new_node[k] = resolve_node(v)
            return new_node
        
        elif isinstance(node, list):
            return [resolve_node(item) for item in node]
        
        return node

    # 4. Resolve the root schema
    resolved_schema = resolve_node(schema)
    
    return resolved_schema
