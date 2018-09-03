import { event as d3_event } from 'd3-selection';

import { t } from '../locale';
import { krError } from '../../osm';

import { errorTypes } from './errorSchema.json';

// TODO: remove these objects, here for reference
var keepRightSchema = {
        'schema': '',
        'id': 0,
        'error_type': 0,
        'error_name': 0,
        'object_type': [
            'node',
            'way',
            'relation'
        ],
        'object_id': 0,
        'state': [
            'new',
            'reopened',
            'ignore_temporarily',
            'ignore'
        ],
        'first_occurrence': new Date(),
        'last_checked': new Date(),
        'object_timestamp': new Date(),
        'user_name': '',
        'lat': 0,
        'lon': 0,
        'comment': '',
        'comment_timestamp': new Date(),
        'msgid': '',
        'txt1': '',
        'txt2': '',
        'txt3': '',
        'txt4': '',
        'txt5': ''
    };

var keepRightSchemaFromWeb = {
    'error_type': '192',
    'object_type': 'way',
    'object_id': '339948768',
    'comment': null,
    'error_id': '92854860',
    'schema': '58',
    'description': 'This waterway intersects the highway #450282565',
    'title': 'intersections without junctions, highway-waterway'
};

export function parseErrorDescriptions(entity) {
    var parsedDetails = {};
    var html_re = new RegExp(/<\/[a-z][\s\S]*>/);
    var commonEntities = [
        'node',
        'way',
        'relation',
        'highway',
        'cycleway',
        'waterway',
        'riverbank'
    ]; // TODO: expand this list, or implement a different translation function

    var errorType;
    var errorTemplate;
    var errorDescription;
    var errorRegex;
    var errorMatch;

    function fillPlaceholder(d) { return '<span><a class="kr_error_description-id">' + d + '</a></span>'; }

    // arbitrary node list of form: #ID, #ID, #ID...
    function parseError211(list) {
        var newList = [];
        var items = list.split(', ');

        items.forEach(function(item) {
            // ID has # at the front
            var id = fillPlaceholder('n' + item.slice(1));
            newList.push(id);
        });

        return newList.join(', ');
    }

    // arbitrary way list of form: #ID(layer),#ID(layer),#ID(layer)...
    function parseError231(list) {
        var newList = [];
        var items = list.split(',');

        items.forEach(function(item) {
            var id;
            var layer;

            // item of form "#ID(layer)"
            item = item.split('(');

            // ID has # at the front
            id = item[0].slice(1);
            id = fillPlaceholder('w' + id);

            // layer has trailing )
            layer = item[1].slice(0,-1);

            // TODO: translation
            newList.push(id + ' (layer: ' + layer + ')');
        });

        return newList.join(', ');
    }

    // arbitrary node/relation list of form: from node #ID,to relation #ID,to node #ID...
    function parseError294(list) {
        var newList = [];
        var items = list.split(',');

        items.forEach(function(item) {
            var role;
            var idType;
            var id;

            // item of form "from/to node/relation #ID"
            item = item.split(' ');

            // to/from role is more clear in quotes
            role = '"' + item[0] + '"';

            // first letter of node/relation provides the type
            idType = item[1].slice(0,1);

            // ID has # at the front
            id = item[2].slice(1);
            id = fillPlaceholder(idType + id);

            item = [role, item[1], id].join(' ');
            newList.push(item);
        });

        return newList.join(', ');
    }

    if (!(entity instanceof krError)) return;

    // find the matching template from the error schema
    errorType = '_' + entity.error_type;
    errorTemplate = errorTypes.errors[errorType] || errorTypes.warnings[errorType];
    if (!errorTemplate) return;

    // some descriptions are just fixed text
    if (!('regex' in errorTemplate)) return;

    // regex pattern should match description with variable details captured as groups
    errorDescription = entity.description;
    errorRegex = new RegExp(errorTemplate.description);
    errorMatch = errorRegex.exec(errorDescription);
    if (!errorMatch) {
        // TODO: Remove, for regex dev testing
        console.log('Unmatched:', errorType, errorDescription, errorRegex);
        return;
    }

    errorMatch.forEach(function(group, index) {
        var idType;

        // index 0 is the whole match, skip it
        if (!index) return;

        // link IDs if present in the group
        idType = 'IDs' in errorTemplate ? errorTemplate.IDs[index-1] : '';
        if (idType) {
            switch (idType) {
                // simple case just needs a linking span
                case 'n':
                case 'w':
                case 'r':
                    group = fillPlaceholder(idType + group);
                    break;
                // some errors have more complex ID lists/variance
                case '211':
                    group = parseError211(group);
                    break;
                case '231':
                    group = parseError231(group);
                    break;
                case '294':
                    group = parseError294(group);
            }
        } else if (html_re.test(group)) {
            // escape any html in non-IDs
            group = '\\' +  group + '\\';
        }

        // translate common words (e.g. node, way, relation)
        if (commonEntities.includes(group)) {
            group = t('QA.keepRight.entities.' + group);
        }

        parsedDetails['var' + index] = group;
    });

    return parsedDetails;
}


export function clickLink(context, id) {
        d3_event.preventDefault();
        context.layers().layer('osm').enabled(true);
        context.zoomToEntity(id);
    }
