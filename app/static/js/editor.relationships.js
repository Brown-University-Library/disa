editor.relationships = (function( $container ) {
  var
    configMap, stateMap, jqueryMap,

    initModule, setJqueryMap,

    setListeners, loadData;

    configMap = {
      main_html : String()
        + '<table>'
          + '<tbody id="matrix">'
          + '</tbody>'
        + '</table>'
    }

    stateMap = {
      $root: undefined,
      ref_rels: [],
      rels : [],
      rel_invrs: {},
      referents : {}
    };

    jqueryMap = {};

    setJqueryMap = function() {
      var $root = stateMap.$root;

      $root.append(configMap.main_html);

      jqueryMap = {
        $root : $root,
        $matrix : $root.find('#matrix')
      }

      return true;
    }

    setListeners = function() {
      // $( jqueryMap.$root ).on('dataLoaded', function (e) {
      //   for ()
      // });
      $( jqueryMap.$root ).on('click', '.add-relationship', function(e) {
        e.preventDefault();
        console.log( $(this).closest('person-row').attr('data-person-id') );
      });
    }

    cellMaker = function ( val ) {
      return $('<span/>',
        { 'class'     : 'matrix-val',
          'data-val'  : val,
          'text'      : val,
        });
    }

    colMaker = function ( val ) {
      return $('<li/>',
        { 'class'     : 'matrix-prop',
          'data-prop' : val,
          'text'      : val,
        });
    }

    updateMatrixData = function ( dataObj, domMap ) {
      var $matrix = domMap.$matrix;

      $row = $matrix.find(`.matrix-row[data-sbj=${dataObj.sbj}]`);
      $col = $row.find('.props');
      $arr = $col.find(`.matrix-prop[data-prop=${dataObj.prop}]`);
      if ($arr.length == 0) {
        console.log($col);
        console.log(colMaker(dataObj.prop) );
        $col.append( colMaker(dataObj.prop) );
      }
      $cells = $col.find('.vals');
      $cell = $cells.find(`.matrix-val[data-val=${dataObj.val}]`);
      if ($cell.length == 0) {
        $cells.append( cellMaker(dataObj.val) );
      }

      return true;
    } 

    refreshMatrixData = function () {
      stateMap.ref_rels.forEach( function(rel) {
        updateMatrixData(rel, jqueryMap);
      });
    }

    writeMatrixRow = function ( rowSbj, domMap ) {
      var $row, $list, $td_sbj,
        $td_props, $props_list,

        $matrix = domMap.$matrix;

      $row = $('<tr/>',
        { 'class'     : 'matrix-row',
          'data-sbj'  : rowSbj.id,
        });
      $td_sbj = $('<td/>', { 'text': rowSbj.name })
      $td_props = $('<td/>');
      $props_list = $('<ul/>', {'class': 'props'});

      $td_props.append($props_list);
      $row.append($td_sbj).append($td_props);
      $matrix.append($row);
    }

    initializeMatrix = function() {
      stateMap.referents.forEach( function (ref) {
        writeMatrixRow( ref, jqueryMap );
      });
      refreshMatrixData();
    } 

    loadData = function ( data ) {
      stateMap.ref_rels = data.referent_relationships;
      stateMap.referents = data.referents;
      stateMap.rels = data.relationships;
      // stateMap.rel_invrs = data['inverse_relationships'];

      initializeMatrix();
    }

    initModule = function( $container ) {
        stateMap.$root = $container;
        stateMap.section_id = $container.attr('data-section-id');
        setJqueryMap();
        setListeners();

        $.ajax({
          dataType: "json",
          url: '/data/relationships/' + stateMap.section_id,
          success: function( data ) {
            loadData( data );
          }
        });
    }

    return { initModule: initModule };
}());