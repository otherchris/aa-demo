// @flow
import React from 'react';
import DropdownList from 'react-widgets/lib/DropdownList';
import ClearBtn from '../../Table/components/global/ClearBtn';
import ChildOrgBtn from '../../Table/components/global/ChildOrgBtn';
import SearchBar from '../../Table/components/global/SearchBar';
import { isAdmin } from '../../../api/Users/helpers.simple';

const filterWithChild = (org: { _id: string }) => [
  {
    or: [
      {
        id: 'orgIdParents',
        value: org._id,
        operator: '$in',
      },
      {
        id: 'orgId',
        value: org._id,
        operator: '$eq',
      },
    ],
  },
];

type Props = {
  updateSorted: Function,
  updateFiltered: Function,
  updateAll: Function,
  currentUserCols: Array<any>,
  currentUser: Object,
  tableRef: Object,
  adminDash?: boolean,
  orgs: Array<Object>,
  parentOrg: Object,
  hideChildOrgBtn: boolean,
  ignoreDefaultFilter: boolean,
  defaultFiltered: Array<Object>,
};

type State = {
  dropdownOpen: boolean,
  parent: ?Object,
  value: ?Object,
  phaseValue: ?Object,
  includeChildren: boolean,
  toggle: boolean,
};

export default class CreativesTableButtons extends React.Component<Props, State> {
  static defaultProps = {
    hideChildOrgBtn: false,
  };

  constructor(props: Props) {
    super(props);
    this.toggle = this.toggle.bind(this);
    this.handleIncludeChildren = this.handleIncludeChildren.bind(this);
    this.handleToggleChildOrg = this.handleToggleChildOrg.bind(this);
    this.state = {
      dropdownOpen: false,
      parent: props.parentOrg || null,
      value: null,
      phaseValue: null,
      includeChildren: false,
      toggle: false,
    };
  }
  toggle: Function;
  handleIncludeChildren: Function;
  handleToggleChildOrg: Function;
  handleToggleChildOrg() {
    this.setState(prevState => ({
      toggle: !prevState.toggle,
    }));
  }

  toggle() {
    this.setState({
      dropdownOpen: !this.state.dropdownOpen,
    });
  }

  handleIncludeChildren() {
    this.setState(prevState => ({
      includeChildren: !prevState.includeChildren,
    }));
  }

  render() {
    const {
      adminDash,
      tableRef,
      currentUserCols,
      updateFiltered,
      // updateSorted,
      updateAll,
      currentUser,
      orgs,
      parentOrg,
      hideChildOrgBtn, // true false to disable buttons
      ignoreDefaultFilter,
      defaultFiltered,
    } = this.props;
    // eslint-disable-next-line
    const Phases = [
      {
        label: 'Edit',
        icon: 'edit',
        filterList: [
          {
            or: [
              { id: 'status', value: '0', operator: '$eq' },
              { id: 'status', value: '1', operator: '$eq' },
              { id: 'status', value: '2', operator: '$eq' },
              { id: 'status', value: '3', operator: '$eq' },
            ],
          },
        ],
        sortList: [{ id: 'updated', value: 'asc' }],
      },
      {
        label: 'Review',
        icon: 'eye',
        filterList: [
          {
            or: [
              { id: 'status', value: '8', operator: '$eq' },
              { id: 'status', value: '9', operator: '$eq' },
            ],
          },
        ],
        sortList: [{ id: 'updated', value: 'asc' }],
      },
      {
        label: 'Processing',
        icon: 'cogs',
        filterList: [
          {
            or: [
              { id: 'status', value: '4', operator: '$eq' },
              { id: 'status', value: '5', operator: '$eq' },
              { id: 'status', value: '6', operator: '$eq' },
              { id: 'status', value: '7', operator: '$eq' },
            ],
          },
        ],
        sortList: [{ id: 'updated', value: 'asc' }],
      },
      {
        label: 'Active',
        icon: 'calendar-check-o',
        filterList: [
          {
            or: [
              { id: 'status', value: '10', operator: '$eq' },
              { id: 'status', value: '11', operator: '$eq' },
              { id: 'status', value: '20', operator: '$eq' },
            ],
          },
        ],
        sortList: [{ id: 'updated', value: 'asc' }],
      },
      {
        label: 'Closed',
        icon: 'ban',
        filterList: [
          {
            or: [
              { id: 'status', value: '96', operator: '$eq' },
              { id: 'status', value: '97', operator: '$eq' },
              { id: 'status', value: '98', operator: '$eq' },
              { id: 'status', value: '99', operator: '$eq' },
            ],
          },
        ],
        sortList: [{ id: 'updated', value: 'asc' }],
      },
    ];

    // Passed to ClearBtn to reset dropdowns, etc.
    const resetOther = () => {
      this.setState({
        parent: parentOrg || null,
        value: null,
        phaseValue: null,
        toggle: false,
        includeChildren: false,
      });
    };

    const byOrg = (org: { _id: string }) => {
      this.setState({
        parent: org,
        value: org,
      });
      const parentOnlyFilter = [
        {
          id: 'orgId',
          value: org._id,
          operator: '$eq',
        },
      ];

      if (this.state.includeChildren) {
        tableRef.setState(
          {
            filtered: filterWithChild(org), // Default Filter Stays
            sorted: [{ id: 'updated', desc: true }],
            page: 0,
            ignoreDefaultFilter,
          },
          () => {
            tableRef.fireFetchData();
          },
        );
      } else {
        tableRef.setState(
          {
            filtered: parentOnlyFilter, // Default Filter Stays
            sorted: [{ id: 'updated', desc: true }],
            page: 0,
            ignoreDefaultFilter,
          },
          () => {
            tableRef.fireFetchData();
          },
        );
      }
    };

    const adminDashButtons = () => {
      if (adminDash) {
        return <div className="btn-group mr-2" role="group" />;
      }
      return <div className="btn-group mr-2" role="group" />;
    };

    return (
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        margin: 5,
      }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', marginBottom: 10 }}>
          <div style={{ marginTop: 5 }}>
            <ClearBtn
              tableRef={tableRef}
              resetOther={resetOther}
            />
            <span style={{ marginLeft: 5, marginRight: 5 }}>
              {isAdmin(currentUser) && adminDashButtons()}
            </span>
          </div>

          <div style={{ marginTop: 5, marginRight: 5, minWidth: `${225}px` }}>
            <DropdownList
              data={Phases}
              placeholder="Phases"
              textField="label"
              filter="contains"
              onChange={item => updateAll(
                tableRef.getResolvedState().ignoreDefaultFilter
                  ? item.filterList.concat(filterWithChild(parentOrg))
                  : item.filterList,
                item.sortList,
              )}
            />
          </div>
          <div style={{ marginTop: 5 }}>
            {orgs && (
              <DropdownList
                data={orgs}
                placeholder="Orgs"
                textField="name"
                filter="contains"
                value={this.state.value}
                onChange={value => byOrg(value)}
              />
            )}
            {!hideChildOrgBtn && (
              <ChildOrgBtn
                tableRef={tableRef}
                parentOrg={this.state.parent}
                handleIncludeChildren={this.handleIncludeChildren}
                byOrg={byOrg}
                handleToggleChildOrg={this.handleToggleChildOrg}
                toggle={this.state.toggle}
              />
            )}
          </div>
        </div>
        <div style={{ marginTop: 5 }}>
          <SearchBar
            defaultFiltered={defaultFiltered}
            currentUserCols={currentUserCols}
            updateFiltered={updateFiltered}
          />
        </div>
      </div>
    );
  }
}
