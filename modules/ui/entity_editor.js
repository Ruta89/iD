import { dispatch as d3_dispatch } from 'd3-dispatch';
import {event as d3_event, selectAll as d3_selectAll } from 'd3-selection';
import deepEqual from 'fast-deep-equal';

import { t } from '../util/locale';
import { tooltip } from '../util/tooltip';
import { actionChangePreset } from '../actions/change_preset';
import { actionChangeTags } from '../actions/change_tags';
import { uiPresetFavoriteButton } from './preset_favorite_button';
import { uiPresetIcon } from './preset_icon';
import { uiQuickLinks } from './quick_links';
import { uiRawMemberEditor } from './raw_member_editor';
import { uiRawMembershipEditor } from './raw_membership_editor';
import { uiRawTagEditor } from './raw_tag_editor';
import { uiTagReference } from './tag_reference';
import { uiPresetBrowser } from './preset_browser';
import { uiPresetEditor } from './preset_editor';
import { uiEntityIssues } from './entity_issues';
import { uiTooltipHtml } from './tooltipHtml';
import { utilCleanTags, utilRebind } from '../util';
import { uiViewOnOSM } from './view_on_osm';


export function uiEntityEditor(context) {
    var dispatch = d3_dispatch('choose');
    var _state = 'select';
    var _coalesceChanges = false;
    var _modified = false;
    var _scrolled = false;
    var _base;
    var _entityID;
    var _activePreset;
    var _tagReference;
    var _presetFavorite;

    var entityIssues = uiEntityIssues(context);
    var quickLinks = uiQuickLinks();
    var presetEditor = uiPresetEditor(context).on('change', changeTags);
    var rawTagEditor = uiRawTagEditor(context).on('change', changeTags);
    var rawMemberEditor = uiRawMemberEditor(context);
    var rawMembershipEditor = uiRawMembershipEditor(context);
    var presetBrowser = uiPresetBrowser(context, [], choosePreset);

    function entityEditor(selection) {
        var entity = context.entity(_entityID);
        var tags = Object.assign({}, entity.tags);  // shallow copy

        /*
        var hasNonGeometryTags = entity.hasNonGeometryTags();
        var isTaglessOrIntersectionVertex = entity.geometry(context.graph()) === 'vertex' &&
            (!hasNonGeometryTags && !entity.isHighwayIntersection(context.graph()));
        var issues = context.validator().getEntityIssues(_entityID);
        // start with the preset list if the feature is new and untagged or is an uninteresting vertex
        var showPresetList = (newFeature && !hasNonGeometryTags) || (isTaglessOrIntersectionVertex && !issues.length);
        */

        // Body
        var body = selection.selectAll('.inspector-body')
            .data([0]);

        // Enter
        var bodyEnter = body.enter()
            .append('div')
            .attr('class', 'inspector-body sep-top')
            .on('scroll.entity-editor', function() { _scrolled = true; });

        var presetButtonWrap = bodyEnter
            .append('div')
            .attr('class', 'preset-list-item inspector-inner')
            .append('div')
            .attr('class', 'preset-list-button-wrap');

        presetButtonWrap.append('button')
            .attr('class', 'preset-list-button preset-reset')
            .call(tooltip().title(t('inspector.back_tooltip')).placement('bottom'))
            .append('div')
            .attr('class', 'label')
            .append('div')
            .attr('class', 'label-inner');

        presetButtonWrap.append('div')
            .attr('class', 'accessory-buttons');

        if (!bodyEnter.empty()) {
            presetBrowser.render(bodyEnter);
        }

        bodyEnter
            .append('div')
            .attr('class', 'preset-quick-links');

        bodyEnter
            .append('div')
            .attr('class', 'entity-issues');

        bodyEnter
            .append('div')
            .attr('class', 'preset-editor');

        bodyEnter
            .append('div')
            .attr('class', 'raw-tag-editor inspector-inner');

        bodyEnter
            .append('div')
            .attr('class', 'raw-member-editor inspector-inner');

        bodyEnter
            .append('div')
            .attr('class', 'raw-membership-editor inspector-inner');

        bodyEnter
            .append('input')
            .attr('type', 'text')
            .attr('class', 'key-trap');


        var footer = selection.selectAll('.inspector-footer')
            .data([0]);

        footer = footer.enter()
            .append('div')
            .attr('class', 'inspector-footer')
            .merge(footer);

        footer
            .call(uiViewOnOSM(context)
                .what(context.hasEntity(_entityID))
            );


        // Update
        body = body
            .merge(bodyEnter);

        if (_presetFavorite) {
            body.selectAll('.preset-list-button-wrap accessory-buttons')
                .call(_presetFavorite.button);
        }

        // update header
        if (_tagReference) {
            body.selectAll('.preset-list-button-wrap .accessory-buttons')
                .call(_tagReference.button);

            body.selectAll('.preset-list-item')
                .call(_tagReference.body);
        }

        body.selectAll('.preset-reset')
            .on('click', function() {
                if (presetBrowser.isShown()) {
                    presetBrowser.hide();
                } else {
                    presetBrowser.setAllowedGeometry([context.geometry(_entityID)]);
                    presetBrowser.show();
                }
                //dispatch.call('choose', this, _activePreset);
            })
            .on('mousedown', function() {
                d3_event.preventDefault();
                d3_event.stopPropagation();
            })
            .on('mouseup', function() {
                d3_event.preventDefault();
                d3_event.stopPropagation();
            });

        body.select('.preset-list-item button')
            .call(uiPresetIcon(context)
                .geometry(context.geometry(_entityID))
                .preset(_activePreset)
                .pointMarker(false)
            );

        // NOTE: split on en-dash, not a hypen (to avoid conflict with hyphenated names)
        var label = body.select('.label-inner');
        var nameparts = label.selectAll('.namepart')
            .data(_activePreset.name().split(' – '), function(d) { return d; });

        nameparts.exit()
            .remove();

        nameparts
            .enter()
            .append('div')
            .attr('class', 'namepart')
            .text(function(d) { return d; });

        // update quick links
        var choices = [{
            id: 'zoom_to',
            label: 'inspector.zoom_to.title',
            tooltip: function() {
                return uiTooltipHtml(t('inspector.zoom_to.tooltip_feature'), t('inspector.zoom_to.key'));
            },
            click: function zoomTo() {
                context.mode().zoomToSelected();
            }
        }];

        body.select('.preset-quick-links')
            .call(quickLinks.choices(choices));


        // update editor sections
        body.select('.entity-issues')
            .call(entityIssues
                .entityID(_entityID)
            );

        body.select('.preset-editor')
            .call(presetEditor
                .preset(_activePreset)
                .entityID(_entityID)
                .tags(tags)
                .state(_state)
            );

        body.select('.raw-tag-editor')
            .call(rawTagEditor
                .preset(_activePreset)
                .entityID(_entityID)
                .tags(tags)
                .state(_state)
            );

        if (entity.type === 'relation') {
            body.select('.raw-member-editor')
                .style('display', 'block')
                .call(rawMemberEditor
                    .entityID(_entityID)
                );
        } else {
            body.select('.raw-member-editor')
                .style('display', 'none');
        }

        body.select('.raw-membership-editor')
            .call(rawMembershipEditor
                .entityID(_entityID)
            );

        body.select('.key-trap')
            .on('keydown.key-trap', function() {
                // On tabbing, send focus back to the first field on the inspector-body
                // (probably the `name` field) #4159
                if (d3_event.keyCode === 9 && !d3_event.shiftKey) {
                    d3_event.preventDefault();
                    body.select('input').node().focus();
                }
            });

        context.history()
            .on('change.entity-editor', historyChanged);


        function historyChanged(difference) {
            if (_state === 'hide') return;
            var significant = !difference ||
                    difference.didChange.properties ||
                    difference.didChange.addition ||
                    difference.didChange.deletion;
            if (!significant) return;

            var entity = context.hasEntity(_entityID);
            var graph = context.graph();
            if (!entity) return;

            var match = context.presets().match(entity, graph);
            var activePreset = entityEditor.preset();
            var weakPreset = activePreset &&
                Object.keys(activePreset.addTags || {}).length === 0;

            // A "weak" preset doesn't set any tags. (e.g. "Address")
            // Don't replace a weak preset with a fallback preset (e.g. "Point")
            if (!(weakPreset && match.isFallback())) {
                entityEditor.preset(match);
            }
            entityEditor.modified(_base !== graph);
            entityEditor(selection);
        }
    }

    function choosePreset(preset, geom) {
        context.presets().setMostRecent(preset, geom);
        context.perform(
            actionChangePreset(_entityID, _activePreset, preset),
            t('operations.change_tags.annotation')
        );

        context.validator().validate();  // rerun validation
    }


    // Tag changes that fire on input can all get coalesced into a single
    // history operation when the user leaves the field.  #2342
    function changeTags(changed, onInput) {
        var entity = context.entity(_entityID);
        var annotation = t('operations.change_tags.annotation');
        var tags = Object.assign({}, entity.tags);   // shallow copy

        for (var k in changed) {
            if (!k) continue;
            var v = changed[k];
            if (v !== undefined || tags.hasOwnProperty(k)) {
                tags[k] = v;
            }
        }

        if (!onInput) {
            tags = utilCleanTags(tags);
        }

        if (!deepEqual(entity.tags, tags)) {
            if (_coalesceChanges) {
                context.overwrite(actionChangeTags(_entityID, tags), annotation);
            } else {
                context.perform(actionChangeTags(_entityID, tags), annotation);
                _coalesceChanges = !!onInput;
            }
        }

        // if leaving field (blur event), rerun validation
        if (!onInput) {
            context.validator().validate();
        }
    }


    entityEditor.modified = function(val) {
        if (!arguments.length) return _modified;
        _modified = val;
        d3_selectAll('button.preset-close use')
            .attr('xlink:href', (_modified ? '#iD-icon-apply' : '#iD-icon-close'));
        return entityEditor;
    };


    entityEditor.state = function(val) {
        if (!arguments.length) return _state;
        _state = val;
        return entityEditor;
    };


    entityEditor.entityID = function(val) {
        if (!arguments.length) return _entityID;
        if (_entityID === val) return entityEditor;  // exit early if no change

        _entityID = val;
        _base = context.graph();
        _coalesceChanges = false;

        // reset the scroll to the top of the inspector (warning: triggers reflow)
        if (_scrolled) {
            window.requestIdleCallback(function() {
                var body = d3_selectAll('.entity-editor-pane .inspector-body');
                if (!body.empty()) {
                    _scrolled = false;
                    body.node().scrollTop = 0;
                }
            });
        }

        var presetMatch = context.presets().match(context.entity(_entityID), _base);

        return entityEditor
            .preset(presetMatch)
            .modified(false);
    };


    entityEditor.preset = function(val) {
        if (!arguments.length) return _activePreset;
        if (val !== _activePreset) {
            _activePreset = val;
            _tagReference = uiTagReference(_activePreset.reference(context.geometry(_entityID)), context)
                .showing(false);
        }
        _presetFavorite = uiPresetFavoriteButton(_activePreset, context.geometry(_entityID), context);
        return entityEditor;
    };


    return utilRebind(entityEditor, dispatch, 'on');
}
