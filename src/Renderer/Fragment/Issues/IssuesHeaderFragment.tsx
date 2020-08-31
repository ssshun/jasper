import React from 'react';
import {FilterHistoryRepo} from '../../Repository/FilterHistoryRepo';
import styled from 'styled-components';
import {View} from '../../Library/View/View';
import {TextInput} from '../../Library/View/TextInput';
import {border, font, fontWeight, space} from '../../Library/Style/layout';
import {IssueIPC} from '../../../IPC/IssueIPC';
import {appTheme} from '../../Library/Style/appTheme';
import {ContextMenu, ContextMenuType} from '../../Library/View/ContextMenu';
import {IconNameType} from '../../Library/Type/IconNameType';
import {Text} from '../../Library/View/Text';
import {IconButton} from '../../Library/View/IconButton';
import {color} from '../../Library/Style/color';

export type SortQueryEntity = 'sort:updated' | 'sort:read' | 'sort:created' | 'sort:closed' | 'sort:merged' | 'sort:dueon';

type Props = {
  streamName: string;
  issueCount: number;
  filterQuery: string;
  sortQuery: SortQueryEntity;
  onExecFilter: (filterQuery: string) => void;
  onExecToggleFilter: (filterQuery: string) => void;
  onExecSort: (sortQuery: SortQueryEntity) => void;
}

type State = {
  mode: 'normal' | 'filter';
  filterQuery: string;
  filterHistories: string[];
  showFilterMenu: boolean;
  showSortMenu: boolean;
}

export class IssuesHeaderFragment extends React.Component<Props, State> {
  state: State = {
    mode: 'normal',
    filterQuery: this.props.filterQuery,
    filterHistories: [],
    showFilterMenu: false,
    showSortMenu: false,
  }

  private filterMenus: ContextMenuType[];
  private filterMenuPos: {top: number; left: number};

  private sortMenus: ContextMenuType[];
  private sortMenuPos: {top: number; left: number};

  private textInput: TextInput;

  componentDidMount() {
    this.loadFilterHistories();
    IssueIPC.onFocusFilter(() => this.textInput.focus());
  }

  componentDidUpdate(prevProps: Readonly<Props>, _prevState: Readonly<State>, _snapshot?: any) {
    if (this.props.filterQuery !== prevProps.filterQuery) {
      this.setState({filterQuery: this.props.filterQuery});
    }
  }

  private async loadFilterHistories() {
    const {error, filterHistories} = await FilterHistoryRepo.getFilterHistories(10);
    if (error) return console.error(error);

    this.setState({filterHistories: filterHistories.map(v => v.filter)});
  }

  private async handleExecFilter() {
    const filterQuery = this.state.filterQuery;
    this.props.onExecFilter(filterQuery);

    if (filterQuery) {
      const {error} = await FilterHistoryRepo.createFilterHistory(filterQuery);
      if (error) return console.error(error);
      await this.loadFilterHistories();
    }
  }

  private async handleExecSort(sortQuery: SortQueryEntity) {
    this.props.onExecSort(sortQuery);
  }

  private handleShowFilterMenu(ev: React.MouseEvent) {
    const i = (filterQuery: string): IconNameType => {
      const regExp = new RegExp(` *${filterQuery} *`);
      const matched = this.state.filterQuery.match(regExp);
      return matched ? 'check-box-outline' : 'checkbox-blank-outline';
    };

    this.filterMenus = [
      {icon: i('is:unread'), label: 'Filter by unread', handler: () => this.props.onExecToggleFilter('is:unread')},
      {icon: i('is:open'), label: 'Filter by open', handler: () => this.props.onExecToggleFilter('is:open')},
      {icon: i('is:bookmark'), label: 'Filter by bookmark', handler: () => this.props.onExecToggleFilter('is:bookmark')},
      {type: 'separator'},
    ];

    if (this.state.mode === 'normal') {
      this.filterMenus.push({icon: 'pencil-outline', label: 'Show Filter Edit', handler: () => this.setState({mode: 'filter'})});
    } else {
      this.filterMenus.push({icon: 'pencil-off-outline', label: 'Close Filter Edit', handler: () => this.setState({mode: 'normal'})});
    }

    this.filterMenuPos = {left: ev.clientX, top: ev.clientY};
    this.setState({showFilterMenu: true});
  }

  private handleShowSortMenu(ev: React.MouseEvent) {
    const i = (sortQuery: SortQueryEntity): IconNameType => {
      return this.props.sortQuery === sortQuery ? 'check-box-outline' : 'checkbox-blank-outline';
    }

    this.sortMenus = [
      {icon: i('sort:updated'), label: 'Sort by updated at', handler: () => this.handleExecSort('sort:updated')},
      {icon: i('sort:read'), label: 'Sort by read at', handler: () => this.handleExecSort('sort:read')},
      {icon: i('sort:created'), label: 'Sort by created at', handler: () => this.handleExecSort('sort:created')},
      {icon: i('sort:closed'), label: 'Sort by closed at', handler: () => this.handleExecSort('sort:closed')},
      {icon: i('sort:merged'), label: 'Sort by merged at', handler: () => this.handleExecSort('sort:merged')},
      {icon: i('sort:dueon'), label: 'Sort by due on', handler: () => this.handleExecSort('sort:dueon')},
    ];

    this.sortMenuPos = {left: ev.clientX, top: ev.clientY};
    this.setState({showSortMenu: true});
  }

  render() {
    return (
      <Root>
        {this.renderNormalMode()}
        {this.renderFilterMode()}

        <ContextMenu
          show={this.state.showFilterMenu}
          onClose={() => this.setState({showFilterMenu: false})}
          pos={this.filterMenuPos}
          menus={this.filterMenus}
        />

        <ContextMenu
          show={this.state.showSortMenu}
          onClose={() => this.setState({showSortMenu: false})}
          pos={this.sortMenuPos}
          menus={this.sortMenus}
        />
      </Root>
    );
  }

  renderNormalMode() {
    if (!this.props.streamName) return;
    if (this.state.mode !== 'normal') return;

    return (
      <NormalModeRoot>
        <StreamNameWrap>
          <StreamName>{this.props.streamName}</StreamName>
          <IssueCount>{this.props.issueCount} issues</IssueCount>
        </StreamNameWrap>
        <IconButton name='sort' onClick={ev => this.handleShowSortMenu(ev)} style={{padding: space.small}}/>
        <IconButton name='filter-menu-outline' onClick={ev => this.handleShowFilterMenu(ev)} color={this.state.filterQuery ? color.blue : appTheme().iconColor}/>
      </NormalModeRoot>
    );
  }

  renderFilterMode() {
    if (!this.props.streamName) return;
    if (this.state.mode !== 'filter') return;

    return (
      <FilterModeRoot>
        <TextInput
          ref={ref => this.textInput = ref}
          value={this.state.filterQuery}
          onChange={t => this.setState({filterQuery: t})}
          onClear={() => this.setState({filterQuery: ''}, () => this.handleExecFilter())}
          onEnter={() => this.handleExecFilter()}
          onSelectCompletion={t => this.setState({filterQuery: t}, () => this.handleExecFilter())}
          onFocusCompletion={t => this.setState({filterQuery: t})}
          placeholder='is:open octocat'
          completions={this.state.filterHistories}
          showClearButton='ifNeed'
        />
        <View style={{paddingLeft: space.medium}}/>
        <IconButton name='filter-menu-outline' onClick={ev => this.handleShowFilterMenu(ev)} color={this.state.filterQuery ? color.blue : appTheme().iconColor}/>
      </FilterModeRoot>
    );
  }
}

const Root = styled(View)`
  flex-direction: row;
  /* filter historyを表示するため */
  overflow: visible;
  padding: ${space.medium}px;
  border-bottom: solid ${border.medium}px ${() => appTheme().borderColor};
  width: 100%;
  min-height: 56px;
`;

// normal mode
const NormalModeRoot = styled(View)`
  flex-direction: row;
  align-items: center;
  width: 100%;
`;

const StreamNameWrap = styled(View)`
  flex: 1;
`;

const StreamName = styled(Text)`
  font-weight: ${fontWeight.bold};
`;

const IssueCount = styled(Text)`
  font-size: ${font.tiny}px;
  color: ${() => appTheme().textSoftColor};
`;

// filter mode
const FilterModeRoot = styled(View)`
  width: 100%;
  flex-direction: row;
  align-items: center;
  /* filter historyを表示するため */
  overflow: visible;
`;
