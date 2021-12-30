import requests
import json as js
import pprint as pp

base_url = "https://search-api.epfl.ch/api/unit?hl=en&showall=0&siteSearch=unit.epfl.ch&acro="

nodes = []

def get_sublist(unit: str, parent: str, num):
    request = requests.get(base_url + unit)
    json = request.json()
    # pp.pprint(json)
    # subtree = [{unit: }]
    # pp.pprint(json)
    bot = 1
    if "subunits" in json:
        for i in range(0, len(json["subunits"])):
            # subtree.append(get_sublist(json["subunits"][i]["acronym"]))
            if ("subunits" in json["subunits"][i]) and (len(json["subunits"][i]["subunits"]) != 0):
                bot = 0
            get_sublist(json["subunits"][i]["acronym"], unit, num+1)
    nodes.append({"name": unit, "parent": parent, "value": num, "bottom": bot})

    # print(type(subtree))
get_sublist("EPFL", "EPFL", 0)

with open('data.json', 'w') as f:
    js.dump(nodes, f)

