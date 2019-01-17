// @flow
import React from 'react';
import { Meteor } from 'meteor/meteor';
import ReactTable from 'react-table';
import isFunction from 'lodash/isFunction';
import isArray from 'lodash/isArray';
import isObject from 'lodash/isObject';
import isNil from 'lodash/isNil';
import isEqual from 'lodash/isEqual';
import differenceWith from 'lodash/differenceWith';
import concat from 'lodash/concat';
import { convertSortForTableState } from '../../lib/helpers';
import Alertr from '../../../../api/App/Alertr';

const Tips = () => (
  <div style={{ textAlign: 'center', padding: '5px 0px' }}>
    <em>Tip: Hold shift when sorting to multi-sort</em>
  </div>
);

const removeNullsFromFilterList = (list: Array<any>): Array<any> => {
  for (let i = list.length - 1; i >= 0; i -= 1) {
    const item = list[i];
    if (isNil(item)) {
      list.splice(i, 1);
    }
    if (isObject(item)) {
      if (item.and) {
        item.and = removeNullsFromFilterList(item.and);
        if (item.and.length === 0) list.splice(i, 1);
      }
      if (item.or) {
        item.or = removeNullsFromFilterList(item.or);
        if (item.or.length === 0) list.splice(i, 1);
      }
    }
  }
  return list;
};

class Table extends React.Component<{
  queryData: Object,
  variables: Object,
  columns: Array<any>,
  loading: boolean,
  refetch: Function,
  setTableRef: Function,
  getRowClass: Function,
  defaultFiltered: Array<any>,
  defaultSorted: Array<any>,
  ignoreDefaultFilter: boolean,
  filterList: Array<any>,
  data: Array<any>,
  freeze: boolean,
  defaultPageSize: number,
  tableButtons: any,
}, {
  data: Array<Object>,
  newDataAvailable: boolean,
  currentPage: number,
  currentFilter: Array<Object>,
  currentSort: Array<Object>,
  newData: Array<Object>,
}> {
  state = {
    newDataAvailable: false,
    newData: [],
    data: (this.props.queryData && this.props.queryData.pageData) || [],
    currentPage: this.props.variables && this.props.variables.pageNumber,
    currentFilter: this.props.variables && this.props.variables.filterList,
    currentSort: this.props.variables && this.props.variables.sortList,
  };
  componentDidUpdate = (prevProps: Object) => {
    // Sets the data and other variables based on if
    // user added new data or if they filtered.
    // If user added new data, the banner shows
    // User can continue to filter and search,
    // But must click the banner to remove banner and
    // to see new data.
    const {
      queryData: incomingData,
      variables: { pageNumber, filterList, sortList },
    } = this.props;
    const {
      data: currentData,
      currentPage,
      newDataAvailable,
      newData: storedNewData,
    } = this.state;
    const prevData = prevProps.queryData && prevProps.queryData.pageData;
    const changedData = differenceWith(incomingData && incomingData.pageData, prevData, isEqual);
    const newData = changedData.filter(i => !(currentData.map(x => x._id).includes(i._id)));

    if (changedData.length > 0) {
      if (currentData.length !== 0
        && currentPage === pageNumber
        && newData.length > 0
        && isEqual(this.state.currentFilter, filterList)
        && isEqual(this.state.currentSort, sortList)) {
        // Only displays banner if there was new data,
        // no change in filtering or pages,
        // and if the table already has data in it
        this.setState({ newDataAvailable: true, newData });
      } else if (!isEqual(this.state.currentFilter, filterList) || newDataAvailable) {
        // Ends up here if user is trying to filter with or without banner shown
        this.setState({
          data: incomingData.pageData
            .filter(item => !storedNewData.map(x => x._id).includes(item._id)),
          currentPage: pageNumber,
          currentFilter: filterList,
          currentSort: sortList,
        });
      } else {
        // All else fails
        this.setState({
          data: incomingData.pageData,
          currentPage: pageNumber,
          currentFilter: filterList,
          currentSort: sortList,
        });
      }
    } else if (changedData.length === 0
      && !isEqual(incomingData && incomingData.pageData, prevData)) {
      // Ends up here if theres a search filter result
      // that results in no changed data
      this.setState({
        data: incomingData.pageData,
        currentPage: pageNumber,
        currentFilter: filterList,
        currentSort: sortList,
      });
    }
  }
  updateTableData = () => {
    this.setState({
      data: this.props.queryData.pageData,
      newData: [],
      newDataAvailable: false,
      currentFilter: this.props.variables.filterList,
      currentSort: this.props.variables.sortList,
    });
  }
  fetchData = (reactTableState: any) => {
    const refetch = this.props ? this.props.refetch : null;
    const {
      page,
      pageSize,
      sorted,
      filtered,
      defaultFiltered, // needed for Or And Combos
      ignoreDefaultFilter,
    } = reactTableState;
    /*
    HEADS UP!!!! ALL NEW TABLES NEED A FREEZE prop = true
    This is a part of needed for persisting filters after click
    Take a look at OrderLinesTable to see how to implement the freeze.
    Look at shouldComponentUpdate() and componentDidUpdate()
    */
    if (this.props.freeze) {
      const sortList = sorted
        ? sorted.map(s => ({ field: s.id, order: s.desc ? 'desc' : 'asc' }))
        : [];
      // includes filter.field to pull from defaultFiltered
      const mapValues = filter => {
        const f = {
          field: filter.id || filter.field,
          value: filter.value,
          operator: filter.operator || null,
        };
        if (f.value === '') {
          return null;
        }
        return f;
      };

      const hasOrAnd = filter_list => {
        const list = filter_list.map(filter => {
          if ('and' in filter) {
            const res = hasOrAnd(filter.and);
            return { and: res };
          } else if ('or' in filter) {
            const res = hasOrAnd(filter.or);
            return { or: res };
          }
          return mapValues(filter);
        });
        return list;
      };

      const filterList = filtered ? hasOrAnd(filtered) : [];

      // Make sure to include defaultFiltered when combining list
      const combFilterList = ignoreDefaultFilter
        ? filterList
        : concat(defaultFiltered, filterList);
      if (
        Array.isArray(combFilterList) &&
        combFilterList.length === 1 &&
        combFilterList[0] === null
      ) {
        combFilterList.pop();
      }
      const andList =
        !Array.isArray(combFilterList) || !combFilterList.length
          ? []
          : [{ and: combFilterList }];
      const finalList = removeNullsFromFilterList(andList);
      if (refetch) {
        refetch({
          limit: pageSize,
          pageNumber: page,
          sortList,
          filterList: isArray(finalList) ? finalList : [],
        }).catch(e => {
          Meteor.call('AlertDevs', e.message, {
            limit: pageSize,
            pageNumber: page,
            sortList,
            filterList: isArray(finalList) ? finalList : [],
            url: window && window.location && window.location.href,
            user: Meteor.user()._id,
          });
          Alertr.info(
            `
            Your search has returned a high number of results. Try filtering the results.
          `,
            '',
            { timeout: 10000 },
          );
        });
      }
    }
  };
  render() {
    const {
      variables,
      columns,
      loading,
      setTableRef,
      queryData,
      getRowClass,
      defaultSorted,
      defaultFiltered,
      defaultPageSize,
      tableButtons,
      freeze,
      filterList,
    } = this.props;
    const solution = variables || {
      filterList: this.props.filterList,
      limit: 100,
      pageNumber: 0,
      sortList: { field: 'updated', order: 'asc' },
    };
    const pages = queryData
      ? Math.ceil(queryData.pageInfo.queryCount / solution.limit)
      : 0;
    const defaultSortForTable = convertSortForTableState(defaultSorted);
    return (
      <div>
        {this.state.newDataAvailable &&
        <div className="alert alert-info" role="alert">
          New data available. Click&nbsp;
          <button
            type="button"
            style={{ padding: '0px 0px 1px' }}
            className="btn btn-link"
            onClick={() => this.updateTableData()}
          >
          here
          </button>
          &nbsp;to update the table.
        </div>}
        <ReactTable
          minRows={10}
          defaultPageSize={
            (solution && solution.limit) || defaultPageSize || 20
          }
          data={this.state.data}
          columns={columns}
          manual
          filterable
          pages={pages}
          loading={loading}
          ref={setTableRef}
          onFetchData={reactTableState => this.fetchData(reactTableState)}
          className="-striped -highlight"
          defaultSorted={defaultSortForTable}
          defaultFiltered={defaultFiltered}
          andList={this.fetchData}
          freeze={freeze}
          filterList={(variables && variables.filterList) || filterList}
          queryData={queryData} // Not Setting UI
          /*
           * setting height gives a scrollbar: however, misaligns column headers
           * there are some issues for this on react-tables github
           *   https://github.com/react-tools/react-table/issues/430
           *   https://github.com/react-tools/react-table/issues/309
           *
           * style={{
           *   height: '500px',
           * }}
           */
          getTrProps={(state, rowInfo) => {
            let className = '';
            if (rowInfo) {
              if (getRowClass && isFunction(getRowClass)) {
                className = getRowClass(rowInfo.row);
              }
            }
            return { className };
          }}
          getNoDataProps={() => ({ style: { fontSize: `${32}px` } })}
          getTheadFilterThProps={() => ({ style: { overflow: 'visible' } })}
          getTrGroupProps={() => ({
            style: { overflowY: 'hidden', height: '50px' },
          })}
          getTdProps={() => ({
            style: { height: '40px', alignSelf: 'center' },
          })}
        >
          {(state, makeTable) => (
            <div>
              <div
                style={{
                  border: '1px solid rgba(0, 0, 0, 0.1)',
                  background: 'rgba(0, 0, 0, 0.03)',
                  padding: '5px',
                }}
              >
                {tableButtons()}
              </div>
              {makeTable()}
              <Tips />
            </div>
          )}
        </ReactTable>
      </div>
    );
  }
}

export default Table;
