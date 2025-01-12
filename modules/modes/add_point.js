import { t } from '../util/locale';
import { behaviorDraw } from '../behavior/draw';
import { modeBrowse } from './browse';
import { modeSelect } from './select';
import { osmNode } from '../osm/node';
import { actionAddEntity } from '../actions/add_entity';
import { actionChangeTags } from '../actions/change_tags';
import { actionAddMidpoint } from '../actions/add_midpoint';


export function modeAddPoint(context, mode) {

    mode.id = 'add-point';

    var baselineGraph = context.graph();

    var behavior = behaviorDraw(context)
        .tail(t('modes.add_point.tail'))
        .on('click', add)
        .on('clickWay', addWay)
        .on('clickNode', addNode)
        .on('cancel', cancel)
        .on('finish', cancel);

    var defaultTags = {};
    if (mode.preset) defaultTags = mode.preset.setTags(defaultTags, 'point');

    var _repeatAddedFeature = false;
    var _allAddedEntityIDs = [];

    mode.repeatAddedFeature = function(val) {
        if (!arguments.length) return _repeatAddedFeature;
        _repeatAddedFeature = val;
        return mode;
    };

    mode.addedEntityIDs = function() {
        return _allAddedEntityIDs.filter(function(id) {
            return context.hasEntity(id);
        });
    };

    function add(loc) {
        var node = osmNode({ loc: loc, tags: defaultTags });

        context.perform(
            actionAddEntity(node),
            t('operations.add.annotation.point')
        );

        didFinishAdding(node);
    }


    function addWay(loc, edge) {
        var node = osmNode({ tags: defaultTags });

        context.perform(
            actionAddMidpoint({loc: loc, edge: edge}, node),
            t('operations.add.annotation.vertex')
        );

        didFinishAdding(node);
    }

    function addNode(node) {
        if (Object.keys(defaultTags).length === 0) {
            didFinishAdding(node);
            return;
        }

        var tags = Object.assign({}, node.tags);  // shallow copy
        for (var key in defaultTags) {
            tags[key] = defaultTags[key];
        }

        context.perform(
            actionChangeTags(node.id, tags),
            t('operations.add.annotation.point')
        );

        didFinishAdding(node);
    }

    function didFinishAdding(node) {
        _allAddedEntityIDs.push(node.id);
        if (!mode.repeatAddedFeature()) {
            context.enter(
                modeSelect(context, mode.addedEntityIDs()).newFeature(true)
            );
        }
    }


    function cancel() {
        context.enter(modeBrowse(context));
    }


    function undone() {
        if (context.graph() === baselineGraph || mode.addedEntityIDs().length === 0) {
            context.enter(modeBrowse(context));
        }
    }


    mode.enter = function() {
        context.install(behavior);
        context.history()
            .on('undone.add_point', undone);
    };


    mode.exit = function() {
        context.history()
            .on('undone.add_point', null);
        context.uninstall(behavior);
    };


    return mode;
}
