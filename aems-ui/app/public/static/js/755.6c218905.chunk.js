/*! For license information please see 755.6c218905.chunk.js.LICENSE.txt */
"use strict";(self.webpackChunkaems_client=self.webpackChunkaems_client||[]).push([[755],{14755:function(e,t,n){n.d(t,{P:function(){return L}});var r=function(e,t){return r=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(e,t){e.__proto__=t}||function(e,t){for(var n in t)t.hasOwnProperty(n)&&(e[n]=t[n])},r(e,t)};function i(e,t){function n(){this.constructor=e}r(e,t),e.prototype=null===t?Object.create(t):(n.prototype=t.prototype,new n)}var o=function(){return o=Object.assign||function(e){for(var t,n=1,r=arguments.length;n<r;n++)for(var i in t=arguments[n])Object.prototype.hasOwnProperty.call(t,i)&&(e[i]=t[i]);return e},o.apply(this,arguments)};function s(e,t){var n={};for(var r in e)Object.prototype.hasOwnProperty.call(e,r)&&t.indexOf(r)<0&&(n[r]=e[r]);if(null!=e&&"function"===typeof Object.getOwnPropertySymbols){var i=0;for(r=Object.getOwnPropertySymbols(e);i<r.length;i++)t.indexOf(r[i])<0&&Object.prototype.propertyIsEnumerable.call(e,r[i])&&(n[r[i]]=e[r[i]])}return n}var l=n(81694),a=n.n(l),u=n(72791),p=n(39412),c=n(9418),d=n(32183),m=n(96522),h=n(52041),v=n(58448),f=n(37305).wGP(),I=f+"-select",y=I+"-popover",g=I+"-match-target-width",P=n(38228),w=n(92610),C=function(e){function t(t,n){var r=e.call(this,t,n)||this;return r.timeoutIds=[],r.requestIds=[],r.clearTimeouts=function(){if(r.timeoutIds.length>0){for(var e=0,t=r.timeoutIds;e<t.length;e++){var n=t[e];window.clearTimeout(n)}r.timeoutIds=[]}},r.cancelAnimationFrames=function(){if(r.requestIds.length>0){for(var e=0,t=r.requestIds;e<t.length;e++){var n=t[e];window.cancelAnimationFrame(n)}r.requestIds=[]}},(0,w.KV)("production")||r.validateProps(r.props),r}return(0,P.ZT)(t,e),t.prototype.componentDidUpdate=function(e,t,n){(0,w.KV)("production")||this.validateProps(this.props)},t.prototype.componentWillUnmount=function(){this.clearTimeouts(),this.cancelAnimationFrames()},t.prototype.requestAnimationFrame=function(e){var t=window.requestAnimationFrame(e);return this.requestIds.push(t),function(){return window.cancelAnimationFrame(t)}},t.prototype.setTimeout=function(e,t){var n=window.setTimeout(e,t);return this.timeoutIds.push(n),function(){return window.clearTimeout(n)}},t.prototype.validateProps=function(e){},t}(u.Component),O=n(23845),A=n(85858);function q(e,t,n){return void 0===e||null==t||null==n?t===n:A.mf(e)?e(t,n):t[e]===n[e]}function b(e){if(null==e)return!1;var t=Object.keys(e);return 1===t.length&&"__blueprintCreateNewItemBrand"===t[0]&&"blueprint-create-new-item"===e.__blueprintCreateNewItemBrand}function N(e){return null==e||b(e)?null:e}var R=function(e){function t(t,n){var r,i,o=e.call(this,t,n)||this;o.refHandlers={itemsParent:function(e){return o.itemsParentRef=e}},o.shouldCheckActiveItemInViewport=!1,o.expectedNextActiveItem=null,o.isEnterKeyPressed=!1,o.renderItemList=function(e){var t=o.props,n=t.initialContent,r=t.noResults,i=e.renderCreateItem(),s=function(e,t,n){if(0===e.query.length&&void 0!==n)return n;var r=e.filteredItems.map(e.renderItem).filter((function(e){return null!=e}));return r.length>0?r:t}(e,null!=i?null:r,n);if(null==s&&null==i)return null;var l=o.isCreateItemFirst();return u.createElement(c.v2,{ulRef:e.itemsParentRef},l&&i,s,!l&&i)},o.renderItem=function(e,t){if(!0!==o.props.disabled){var n=o.state,r=n.activeItem,i=n.query,s=o.state.filteredItems.indexOf(e)>=0,l={active:q(o.props.itemsEqual,N(r),e),disabled:T(e,t,o.props.itemDisabled),matchesPredicate:s};return o.props.itemRenderer(e,{handleClick:function(t){return o.handleItemSelect(e,t)},index:t,modifiers:l,query:i})}return null},o.renderCreateItemMenuItem=function(){if(o.isCreateItemRendered()){var e=o.state,t=e.activeItem,n=e.query.trim(),r=b(t);return o.props.createNewItemRenderer(n,r,(function(e){o.handleItemCreate(n,e)}))}return null},o.handleItemCreate=function(e,t){var n,r,i,s,l=null===(r=(n=o.props).createNewItemFromQuery)||void 0===r?void 0:r.call(n,e);null!=l&&(null===(s=(i=o.props).onItemSelect)||void 0===s||s.call(i,l,t),o.maybeResetQuery())},o.handleItemSelect=function(e,t){var n,r;o.setActiveItem(e),null===(r=(n=o.props).onItemSelect)||void 0===r||r.call(n,e,t),o.maybeResetQuery()},o.handlePaste=function(e){for(var t,n=o.props,r=n.createNewItemFromQuery,i=n.onItemsPaste,s=[],l=[],a=0,u=e;a<u.length;a++){var p=u[a],c=E(p,o.props);if(void 0!==c)t=c,l.push(c);else if(o.canCreateItems()){var d=null===r||void 0===r?void 0:r(p);void 0!==d&&l.push(d)}else s.push(p)}o.setQuery(s.join(", "),!1),void 0!==t&&o.setActiveItem(t),null===i||void 0===i||i(l)},o.handleKeyDown=function(e){var t,n,r=e.keyCode;if(r===m.NF||r===m.qN){e.preventDefault();var i=o.getNextActiveItem(r===m.NF?-1:1);null!=i&&o.setActiveItem(i)}else r===m.K5&&(o.isEnterKeyPressed=!0);null===(n=(t=o.props).onKeyDown)||void 0===n||n.call(t,e)},o.handleKeyUp=function(e){var t=o.props.onKeyUp,n=o.state.activeItem;e.keyCode===m.K5&&o.isEnterKeyPressed&&(e.preventDefault(),null==n||b(n)?o.handleItemCreate(o.state.query,e):o.handleItemSelect(n,e),o.isEnterKeyPressed=!1),null===t||void 0===t||t(e)},o.handleInputQueryChange=function(e){var t,n,r=null==e?"":e.target.value;o.setQuery(r),null===(n=(t=o.props).onQueryChange)||void 0===n||n.call(t,r,e)};var s=t.query,l=void 0===s?"":s,a=null===(r=t.createNewItemFromQuery)||void 0===r?void 0:r.call(t,l),p=F(l,t);return o.state={activeItem:void 0!==t.activeItem?t.activeItem:null!==(i=t.initialActiveItem)&&void 0!==i?i:K(p,t.itemDisabled),createNewItem:a,filteredItems:p,query:l},o}return i(t,e),t.ofType=function(){return t},t.prototype.render=function(){var e=this.props,t=e.className,n=e.items,r=e.renderer,i=e.itemListRenderer,l=void 0===i?this.renderItemList:i,a=this.state,u=(a.createNewItem,s(a,["createNewItem"]));return r(o(o({},u),{className:t,handleItemSelect:this.handleItemSelect,handleKeyDown:this.handleKeyDown,handleKeyUp:this.handleKeyUp,handlePaste:this.handlePaste,handleQueryChange:this.handleInputQueryChange,itemList:l(o(o({},u),{items:n,itemsParentRef:this.refHandlers.itemsParent,renderCreateItem:this.renderCreateItemMenuItem,renderItem:this.renderItem}))}))},t.prototype.componentDidUpdate=function(e){var t=this;void 0!==this.props.activeItem&&this.props.activeItem!==this.state.activeItem&&(this.shouldCheckActiveItemInViewport=!0,this.setState({activeItem:this.props.activeItem})),null!=this.props.query&&this.props.query!==e.query?this.setQuery(this.props.query,this.props.resetOnQuery,this.props):O.ms(this.props,e,{include:["items","itemListPredicate","itemPredicate"]})||this.setQuery(this.state.query),this.shouldCheckActiveItemInViewport&&(this.requestAnimationFrame((function(){return t.scrollActiveItemIntoView()})),this.shouldCheckActiveItemInViewport=!1)},t.prototype.scrollActiveItemIntoView=function(){var e=!1!==this.props.scrollToActiveItem,t=!q(this.props.itemsEqual,N(this.expectedNextActiveItem),N(this.props.activeItem));if(this.expectedNextActiveItem=null,e||!t){var n=this.getActiveElement();if(null!=this.itemsParentRef&&null!=n){var r=n.offsetTop,i=n.offsetHeight,o=this.itemsParentRef,s=o.offsetTop,l=o.scrollTop,a=o.clientHeight,u=this.getItemsParentPadding(),p=u.paddingTop,c=r+i+u.paddingBottom-s,d=r-p-s;c>=l+a?this.itemsParentRef.scrollTop=c+i-a:d<=l&&(this.itemsParentRef.scrollTop=d-i)}}},t.prototype.setQuery=function(e,t,n){var r;void 0===t&&(t=this.props.resetOnQuery),void 0===n&&(n=this.props);var i=n.createNewItemFromQuery;this.shouldCheckActiveItemInViewport=!0,e!==this.state.query&&(null===(r=n.onQueryChange)||void 0===r||r.call(n,e));var o=e.trim(),s=F(o,n),l=null!=i&&""!==o?i(o):void 0;this.setState({createNewItem:l,filteredItems:s,query:e});var a=this.getActiveIndex(s);(t||a<0||T(N(this.state.activeItem),a,n.itemDisabled))&&(this.isCreateItemRendered()&&this.isCreateItemFirst()?this.setActiveItem({__blueprintCreateNewItemBrand:"blueprint-create-new-item"}):this.setActiveItem(K(s,n.itemDisabled)))},t.prototype.setActiveItem=function(e){var t,n,r,i;this.expectedNextActiveItem=e,void 0===this.props.activeItem&&(this.shouldCheckActiveItemInViewport=!0,this.setState({activeItem:e})),b(e)?null===(n=(t=this.props).onActiveItemChange)||void 0===n||n.call(t,null,!0):null===(i=(r=this.props).onActiveItemChange)||void 0===i||i.call(r,e,!1)},t.prototype.getActiveElement=function(){var e=this.state.activeItem;if(null!=this.itemsParentRef){if(b(e)){var t=this.isCreateItemFirst()?0:this.state.filteredItems.length;return this.itemsParentRef.children.item(t)}var n=this.getActiveIndex();return this.itemsParentRef.children.item(n)}},t.prototype.getActiveIndex=function(e){void 0===e&&(e=this.state.filteredItems);var t=this.state.activeItem;if(null==t||b(t))return-1;for(var n=0;n<e.length;++n)if(q(this.props.itemsEqual,e[n],t))return n;return-1},t.prototype.getItemsParentPadding=function(){var e=getComputedStyle(this.itemsParentRef),t=e.paddingTop;return{paddingBottom:Q(e.paddingBottom),paddingTop:Q(t)}},t.prototype.getNextActiveItem=function(e,t){if((void 0===t&&(t=this.getActiveIndex()),this.isCreateItemRendered())&&(0===t&&-1===e||t===this.state.filteredItems.length-1&&1===e))return{__blueprintCreateNewItemBrand:"blueprint-create-new-item"};return K(this.state.filteredItems,this.props.itemDisabled,e,t)},t.prototype.isCreateItemRendered=function(){return this.canCreateItems()&&""!==this.state.query&&!this.wouldCreatedItemMatchSomeExistingItem()},t.prototype.isCreateItemFirst=function(){return"first"===this.props.createNewItemPosition},t.prototype.canCreateItems=function(){return null!=this.props.createNewItemFromQuery&&null!=this.props.createNewItemRenderer},t.prototype.wouldCreatedItemMatchSomeExistingItem=function(){var e=this;return this.state.filteredItems.some((function(t){return q(e.props.itemsEqual,t,e.state.createNewItem)}))},t.prototype.maybeResetQuery=function(){this.props.resetOnSelect&&this.setQuery("",!0)},t.displayName=h.g+".QueryList",t.defaultProps={disabled:!1,resetOnQuery:!0},t}(C);function Q(e){return null==e?0:parseInt(e.slice(0,-2),10)}function E(e,t){var n=t.items,r=t.itemPredicate;if(A.mf(r))for(var i=0;i<n.length;i++){var o=n[i];if(r(e,o,i,!0))return o}}function F(e,t){var n=t.items,r=t.itemPredicate,i=t.itemListPredicate;return A.mf(i)?i(e,n):A.mf(r)?n.filter((function(t,n){return r(e,t,n)})):n}function T(e,t,n){return null!=n&&null!=e&&(A.mf(n)?n(e,t):!!e[n])}function K(e,t,n,r){if(void 0===n&&(n=1),void 0===r&&(r=e.length-1),0===e.length)return null;var i,o,s,l=r,a=e.length-1;do{if(s=a,!T(e[l=(i=l+n)<(o=0)?s:i>s?o:i],l,t))return e[l]}while(l!==r&&-1!==r);return null}var L=function(e){function t(){var t,n=e.apply(this,arguments)||this;return n.state={isOpen:!1},n.TypedQueryList=R.ofType(),n.inputElement=null,n.queryList=null,n.handleInputRef=(0,p.Km)(n,"inputElement",null===(t=n.props.inputProps)||void 0===t?void 0:t.inputRef),n.handleQueryListRef=function(e){return n.queryList=e},n.renderQueryList=function(e){var t,r=n.props,i=r.fill,s=r.filterable,l=void 0===s||s,p=r.disabled,m=void 0!==p&&p,h=r.inputProps,v=void 0===h?{}:h,f=r.popoverProps,I=void 0===f?{}:f,P=r.matchTargetWidth;i&&(I.fill=!0),P&&(null==I.modifiers&&(I.modifiers={}),I.modifiers.minWidth={enabled:!0,fn:function(e){return e.styles.width=e.offsets.reference.width+"px",e},order:800},I.usePortal=!1,I.wrapperTagName="div");var w=u.createElement(c.BZ,o({leftIcon:"search",placeholder:"Filter...",rightElement:n.maybeRenderClearButton(e.query)},v,{inputRef:n.handleInputRef,onChange:e.handleQueryChange,value:e.query})),C=e.handleKeyDown,O=e.handleKeyUp;return u.createElement(c.J2,o({autoFocus:!1,enforceFocus:!1,isOpen:n.state.isOpen,disabled:m,position:d.Ly.BOTTOM_LEFT},I,{className:a()(e.className,I.className),onInteraction:n.handlePopoverInteraction,popoverClassName:a()(y,I.popoverClassName,(t={},t[g]=P,t)),onOpening:n.handlePopoverOpening,onOpened:n.handlePopoverOpened,onClosing:n.handlePopoverClosing}),u.createElement("div",{onKeyDown:n.state.isOpen?C:n.handleTargetKeyDown,onKeyUp:n.state.isOpen?O:void 0},n.props.children),u.createElement("div",{onKeyDown:C,onKeyUp:O},l?w:void 0,e.itemList))},n.handleTargetKeyDown=function(e){e.which!==m.NF&&e.which!==m.qN||(e.preventDefault(),n.setState({isOpen:!0}))},n.handleItemSelect=function(e,t){var r,i;n.setState({isOpen:!1}),null===(i=(r=n.props).onItemSelect)||void 0===i||i.call(r,e,t)},n.handlePopoverInteraction=function(e,t){var r,i;n.setState({isOpen:e}),null===(i=null===(r=n.props.popoverProps)||void 0===r?void 0:r.onInteraction)||void 0===i||i.call(r,e,t)},n.handlePopoverOpening=function(e){var t,r;n.previousFocusedElement=document.activeElement,n.props.resetOnClose&&n.resetQuery(),null===(r=null===(t=n.props.popoverProps)||void 0===t?void 0:t.onOpening)||void 0===r||r.call(t,e)},n.handlePopoverOpened=function(e){var t,r;null!=n.queryList&&n.queryList.scrollActiveItemIntoView(),n.requestAnimationFrame((function(){var e,t=n.props.inputProps;!1!==(void 0===t?{}:t).autoFocus&&(null===(e=n.inputElement)||void 0===e||e.focus())})),null===(r=null===(t=n.props.popoverProps)||void 0===t?void 0:t.onOpened)||void 0===r||r.call(t,e)},n.handlePopoverClosing=function(e){var t,r;n.requestAnimationFrame((function(){void 0!==n.previousFocusedElement&&(n.previousFocusedElement.focus(),n.previousFocusedElement=void 0)})),null===(r=null===(t=n.props.popoverProps)||void 0===t?void 0:t.onClosing)||void 0===r||r.call(t,e)},n.resetQuery=function(){return n.queryList&&n.queryList.setQuery("",!0)},n}return i(t,e),t.ofType=function(){return t},t.prototype.render=function(){var e=this.props,t=(e.filterable,e.inputProps,e.popoverProps,s(e,["filterable","inputProps","popoverProps"]));return u.createElement(this.TypedQueryList,o({},t,{onItemSelect:this.handleItemSelect,ref:this.handleQueryListRef,renderer:this.renderQueryList}))},t.prototype.componentDidUpdate=function(e,t){var n,r,i,o,s;(null===(n=e.inputProps)||void 0===n?void 0:n.inputRef)!==(null===(r=this.props.inputProps)||void 0===r?void 0:r.inputRef)&&((0,p.k$)(null===(i=e.inputProps)||void 0===i?void 0:i.inputRef,null),this.handleInputRef=(0,p.Km)(this,"inputElement",null===(o=this.props.inputProps)||void 0===o?void 0:o.inputRef),(0,p.k$)(null===(s=this.props.inputProps)||void 0===s?void 0:s.inputRef,this.inputElement)),this.state.isOpen&&!t.isOpen&&null!=this.queryList&&this.queryList.scrollActiveItemIntoView()},t.prototype.maybeRenderClearButton=function(e){return e.length>0?u.createElement(c.zx,{icon:"cross",minimal:!0,onClick:this.resetQuery}):void 0},t.displayName=h.g+".Select",t}(v.U)}}]);
//# sourceMappingURL=755.6c218905.chunk.js.map