"use strict";(self.webpackChunkaems_client=self.webpackChunkaems_client||[]).push([[212],{65212:function(e,n,t){t.r(n),t.d(n,{default:function(){return te}});var i=t(1413),a=t(9153),d=t(93433),o=t(15671),c=t(43144),l=t(60136),r=t(43668),s=t(50698),u=t(32183),h=t(9418),p=t(36625),x=t(4481),f=t(97626),g=t(23122),v=t(763),m=t(99574),j=t(72791),b=t(80184);function y(e){var n,t=e.unit,i=e.editing,a=e.configurations,d=e.handleChange,o=e.handleCreate,c=e.readOnly,l=(0,j.useCallback)((function(e){return(0,v.get)(i,e,(0,v.get)(t,e))}),[i,t]);return(0,b.jsxs)(b.Fragment,{children:[!c&&(0,b.jsxs)("div",{className:"row",children:[(0,b.jsx)("div",{className:"configuration select",children:(0,b.jsxs)(h.__,{children:[(0,b.jsx)("h3",{children:"Select Configuration"}),(0,b.jsx)(m.p,{content:(0,b.jsxs)(h.v2,{children:[(0,b.jsx)(h.sN,{text:"New Configuration",onClick:function(){return o(t)}}),null===a||void 0===a?void 0:a.map((function(e){return(0,b.jsx)(h.sN,{text:e.label,onClick:function(){return d("configurationId",t)(e.id)}},e.id)}))]}),placement:"bottom-start",children:(0,b.jsx)(h.zx,{rightIcon:g.vv6,minimal:!0,children:(null===t||void 0===t||null===(n=t.configuration)||void 0===n?void 0:n.label)||"Select Configuration..."})})]})}),(0,b.jsx)("div",{})]}),(0,b.jsxs)("div",{className:"row",children:[(0,b.jsx)("div",{className:"label",children:(0,b.jsxs)(h.__,{children:[c?(0,b.jsx)("h3",{children:"Configuration Label"}):(0,b.jsx)("b",{children:"Configuration Label"}),(0,b.jsx)(h.BZ,{type:"text",value:l("configuration.label"),onChange:function(e){return d("configuration.label",i)(e.target.value)},readOnly:c})]})}),(0,b.jsx)("div",{})]})]})}var S=t(29439),C=t(696),N=t(78719),T=t(42632),O=t(72426),M=t.n(O);function R(e){var n,t=e.path,i=e.unit,a=e.editing,d=e.holiday,o=e.handleChange,c=e.readOnly,l=d.id,r=d.label,u=d.type,p=d.month,x=d.day,f=d.observance,m=(0,j.useCallback)((function(e){return(0,v.get)(a,e,(0,v.get)(i,e))}),[a,i]);if("Custom"===u){var y=f&&(null===(n=C.VD.parse(f))||void 0===n?void 0:n.label),S="".concat(M()().set("month",p-1).set("date",x).format("MMMM Do")," ").concat(y&&"(".concat(y,")"));return(0,b.jsx)(b.Fragment,{children:(0,b.jsxs)("div",{className:"row",children:[(0,b.jsx)("div",{children:(0,b.jsxs)(h.__,{children:[(0,b.jsx)("b",{children:r}),(0,b.jsx)(h.BZ,{type:"text",value:S,readOnly:!0})]})}),(0,b.jsx)("div",{children:(0,b.jsx)(h.zx,{icon:g.R4W,intent:s.S.WARNING,minimal:!0,onClick:function(){o(t,a)({id:l,type:u,action:"delete"})},disabled:c})})]})})}return(0,b.jsxs)("div",{className:"row",children:[(0,b.jsx)("div",{className:"holiday",children:(0,b.jsxs)(h.__,{children:[(0,b.jsx)("b",{children:r}),(0,b.jsx)(h.XZ,{label:"Enabled",checked:"Enabled"===m("".concat(t,".type")),onClick:function(){o("".concat(t),a)({id:m("".concat(t,".id")),type:"Enabled"===m("".concat(t,".type"))?"Disabled":"Enabled"})},disabled:c})]})}),(0,b.jsx)("div",{})]})}var D=t(60364),Z=C.R$.values.map((function(e){return e.label}));function k(e){var n=e.unit,t=e.editing,i=e.handleChange,a=e.holidays,d=(0,j.useState)(""),o=(0,S.Z)(d,2),c=o[0],l=o[1],r=(0,j.useState)(new Date),u=(0,S.Z)(r,2),p=u[0],x=u[1],f=(0,j.useState)(""),y=(0,S.Z)(f,2),N=y[0],O=y[1],R=(0,j.useState)(!1),D=(0,S.Z)(R,2),Z=D[0],k=D[1];return(0,b.jsxs)("div",{className:"row",children:[(0,b.jsx)("div",{className:"label",children:(0,b.jsxs)(h.__,{children:[(0,b.jsx)("b",{children:"Holiday Label"}),(0,b.jsx)(h.BZ,{type:"text",value:c,onChange:function(e){return l(e.target.value)}})]})}),(0,b.jsx)("div",{children:(0,b.jsxs)(h.__,{children:[(0,b.jsx)("b",{children:"Date"}),(0,b.jsx)(m.p,{content:(0,b.jsx)(T.M,{value:p,onChange:function(e,n){e&&x(e),k(!n)}}),isOpen:Z,placement:"bottom-start",children:(0,b.jsx)(h.zx,{rightIcon:g.XNV,onClick:function(){return k(!0)},minimal:!0,children:M()(p).format("MMMM Do")})})]})}),(0,b.jsx)("div",{children:(0,b.jsxs)(h.__,{children:[(0,b.jsx)("b",{children:"Observance"}),(0,b.jsx)(m.p,{content:(0,b.jsxs)(h.v2,{children:[(0,b.jsx)(h.sN,{text:"Always on Date",onClick:function(){return O("")}}),C.VD.values.map((function(e){return(0,b.jsx)(h.sN,{text:e.label,onClick:function(){return O(e.label)}},e.name)}))]}),placement:"bottom-start",children:(0,b.jsx)(h.zx,{rightIcon:g.vv6,minimal:!0,children:N||"Always on Date"})})]})}),(0,b.jsx)("div",{children:(0,b.jsx)(h.zx,{icon:g.YZ9,intent:s.S.PRIMARY,minimal:!0,disabled:(0,v.isEmpty)(c)||void 0!==a.find((function(e){return e.label===c})),onClick:function(){var e,a=Math.max((0,v.get)(n,"configuration.holidays.length",0),(0,v.get)(t,"configuration.holidays.length",0));i("configuration.holidays.".concat(a),t)({type:"Custom",label:c,month:p.getMonth()+1,day:p.getDate(),observance:N,configurationId:null===n||void 0===n||null===(e=n.configuration)||void 0===e?void 0:e.id,createdAt:M()().format(),action:"create"}),l(""),x(new Date),O("")},children:"Create Holiday"})})]})}function z(e){var n,t=e.unit,i=e.editing,a=e.handleChange,d=e.readOnly,o=(0,D.I0)(),c=(0,j.useState)(void 0),l=(0,S.Z)(c,2),r=l[0],u=l[1],p=(0,v.merge)([],null===(n=t.configuration)||void 0===n?void 0:n.holidays,(0,v.get)(i,"configuration.holidays"));return p.forEach((function(e,n){return e.index=n})),(0,b.jsxs)(b.Fragment,{children:[!d&&(0,b.jsxs)(h.__,{children:[(0,b.jsx)("h3",{children:"Create Holiday"}),(0,b.jsx)(k,{unit:t,editing:i,handleChange:a,holidays:p})]}),(0,b.jsxs)(h.__,{children:[(0,b.jsx)("h3",{children:"Custom Holidays"}),(0,b.jsx)("ul",{children:(0,v.isEmpty)(p.filter((function(e){return"Custom"===e.type&&"delete"!==e.action})))?(0,b.jsx)("li",{children:"No Custom Holidays Defined"},"empty"):p.filter((function(e){return"Custom"===e.type&&"delete"!==e.action})).sort((function(e,n){return M()(n.createdAt).valueOf()-M()(e.createdAt).valueOf()})).map((function(e,n){return(0,b.jsx)("li",{children:(0,b.jsx)(R,{path:"configuration.holidays.".concat(e.index),unit:t,editing:i,holiday:e,handleChange:a,readOnly:d},e.index)},e.index)}))})]}),(0,b.jsxs)(h.__,{children:[(0,b.jsx)("h3",{children:"Predefined Holidays"}),(0,b.jsx)("ul",{children:p.filter((function(e){return"Custom"!==e.type})).sort((function(e,n){return Z.indexOf(e.label)-Z.indexOf(n.label)})).map((function(e,n){return(0,b.jsx)("li",{children:(0,b.jsx)(R,{path:"configuration.holidays.".concat(e.index),unit:t,editing:i,holiday:e,handleChange:a,readOnly:d},e.index)},e.index)}))})]}),(0,b.jsx)(h.bZ,{intent:s.S.DANGER,isOpen:void 0!==r,confirmButtonText:"Yes",cancelButtonText:"Cancel",onConfirm:function(){var e;return o((0,N.qd)(null!==(e=null===r||void 0===r?void 0:r.id)&&void 0!==e?e:-1))},onClose:function(){return u(void 0)},children:(0,b.jsxs)("p",{children:["Permanently delete the holiday ",null===r||void 0===r?void 0:r.label,"?"]})})]})}var E=t(63769),_=t(48565);function A(e){var n=e.path,t=e.editing,i=e.occupancy,a=e.handleChange,d=i.id,o=i.label,c=i.date,l=i.schedule,r=null===l||void 0===l?void 0:l.label,u="".concat(M()(c).format("dddd MMMM Do YYYY")," ").concat(r&&"(".concat(r,")")),p=M()(c).startOf("day").isBefore(M()().startOf("day"),"day");return(0,b.jsx)(b.Fragment,{children:(0,b.jsxs)("div",{className:"row",children:[(0,b.jsx)("div",{children:(0,b.jsxs)(h.__,{disabled:p,children:[(0,b.jsx)("b",{children:o}),(0,b.jsx)(h.BZ,{type:"text",value:u,disabled:p,readOnly:!0})]})}),(0,b.jsx)("div",{children:(0,b.jsx)(h.zx,{icon:g.R4W,intent:s.S.WARNING,minimal:!0,onClick:function(){a(n,t)({id:d,action:"delete"})}})})]})})}var B,L=t(50668),P=(0,L.parseBoolean)("false"),U={label:"",occupied:!0,startTime:(0,E.cz)(E.S$),endTime:(0,E.cz)(E.Be)};function w(e){var n=e.unit,t=e.editing,i=e.handleChange,a=(0,j.useState)(""),d=(0,S.Z)(a,2),o=d[0],c=d[1],l=(0,j.useState)(new Date),r=(0,S.Z)(l,2),u=r[0],p=r[1],x=(0,j.useState)((0,v.clone)(U)),f=(0,S.Z)(x,2),y=f[0],C=f[1],N=(0,j.useState)(!1),O=(0,S.Z)(N,2),R=O[0],D=O[1],Z=(0,j.useCallback)((function(e){return(0,v.get)(t,e,(0,v.get)(n,e))}),[t,n]),k=M()(u).format("dddd").toLowerCase(),z={schedule:{start:y.occupied?(0,E.xM)(y.startTime,!1):E.lL,end:y.occupied?(0,E.xM)(y.endTime,!0):E.QM},previous:{start:Z("configuration.".concat(k,"Schedule.occupied"))?(0,E.xM)(Z("configuration.".concat(k,"Schedule.startTime")),!1):E.lL,end:Z("configuration.".concat(k,"Schedule.occupied"))?(0,E.xM)(Z("configuration.".concat(k,"Schedule.endTime")),!0):E.QM,occupied:Z("configuration.".concat(k,"Schedule.occupied"))}};return(0,b.jsxs)("div",{className:"row",children:[(0,b.jsx)("div",{className:"label",children:(0,b.jsxs)(h.__,{children:[(0,b.jsx)("b",{children:"Occupancy Label"}),(0,b.jsx)(h.BZ,{type:"text",value:o,onChange:function(e){return c(e.target.value)}})]})}),(0,b.jsxs)("div",{className:"row",children:[(0,b.jsx)("div",{className:"label",children:(0,b.jsxs)(h.__,{children:[(0,b.jsx)("b",{children:"Occupancy Schedule"}),(0,b.jsx)(h.BZ,{type:"text",value:y.label,readOnly:!0})]})}),(0,b.jsx)("div",{className:"occupancy",children:(0,b.jsxs)(h.Zz,{min:E.lL,max:E.QM,stepSize:5,labelStepSize:240,labelRenderer:function(e,n){return null!==n&&void 0!==n&&n.isHandleTooltip||e>E.lL&&e<E.QM?(0,E.li)(e):""},disabled:!y.occupied,children:[(0,b.jsx)(h.Zz.Handle,{type:h.gZ.START,interactionKind:h.qB.LOCK,intentAfter:y.occupied?s.S.SUCCESS:s.S.NONE,value:z.schedule.start,onChange:function(e){var n=(0,v.cloneDeep)(y),t=y.occupied,i=(0,E.xM)(y.endTime,!0),a=(0,v.clamp)(e,E.lL,Math.min(i,E.QM)-E.Ls),d=(0,E.sG)("all",{occupied:t,startTime:a,endTime:i});(0,v.merge)(n,{startTime:(0,E.cz)(a),label:d}),C(n)}}),(0,b.jsx)(h.Zz.Handle,{type:h.gZ.START,interactionKind:h.qB.NONE,intentAfter:z.previous.occupied?(0,v.inRange)(z.previous.start,z.schedule.start,z.schedule.end)?s.S.SUCCESS:s.S.PRIMARY:s.S.NONE,value:z.previous.start}),(0,b.jsx)(h.Zz.Handle,{type:h.gZ.END,interactionKind:h.qB.NONE,intentBefore:z.previous.occupied?(0,v.inRange)(z.previous.end,z.schedule.start,z.schedule.end)?s.S.SUCCESS:s.S.PRIMARY:s.S.NONE,value:z.previous.end}),(0,b.jsx)(h.Zz.Handle,{type:h.gZ.END,interactionKind:h.qB.LOCK,intentBefore:y.occupied?s.S.SUCCESS:s.S.NONE,value:z.schedule.end,onChange:function(e){var n=(0,v.cloneDeep)(y),t=y.occupied,i=(0,E.xM)(y.startTime,!1),a=(0,v.clamp)(e,Math.max(i,E.lL)+E.Ls,E.QM),d=(0,E.sG)("all",{occupied:t,startTime:i,endTime:a});(0,v.merge)(n,{endTime:(0,E.cz)(a),label:d}),C(n)}})]})}),P?(0,b.jsx)("div",{className:"unoccupied",children:(0,b.jsx)(h.XZ,{label:"Unoccupied",checked:!y.occupied,onClick:function(){var e=(0,v.cloneDeep)(y),n=!y.occupied,t=(0,E.xM)(y.startTime,!1),i=(0,E.xM)(y.endTime,!0),a=(0,E.sG)("all",{occupied:n,startTime:t,endTime:i});(0,v.merge)(e,{occupied:n,label:a}),C(e)}})}):(0,b.jsx)("div",{})]}),(0,b.jsx)("div",{children:(0,b.jsxs)(h.__,{children:[(0,b.jsx)("b",{children:"Date"}),(0,b.jsx)(m.p,{content:(0,b.jsx)(T.M,{value:u,onChange:function(e,n){e&&p(e),D(!n)}}),isOpen:R,placement:"bottom-start",children:(0,b.jsx)(h.zx,{rightIcon:g.XNV,onClick:function(){return D(!0)},minimal:!0,children:M()(u).format("dddd MMMM Do YYYY")})})]})}),(0,b.jsx)("div",{children:(0,b.jsx)(h.zx,{icon:g.YZ9,intent:s.S.PRIMARY,minimal:!0,onClick:function(){var e,a=Math.max((0,v.get)(n,"configuration.occupancies.length",0),(0,v.get)(t,"configuration.occupancies.length",0));i("configuration.occupancies.".concat(a),t)({label:o,date:u.toISOString(),schedule:y,configurationId:null===n||void 0===n||null===(e=n.configuration)||void 0===e?void 0:e.id,createdAt:M()().format(),action:"create"}),c(""),p(new Date),C((0,v.clone)(U))},children:"Create Occupancy"})})]})}function I(e){var n,t=e.unit,i=e.editing,a=e.handleChange,d=(0,D.I0)(),o=(0,j.useState)(void 0),c=(0,S.Z)(o,2),l=c[0],r=c[1],u=(0,v.merge)([],null===(n=t.configuration)||void 0===n?void 0:n.occupancies,(0,v.get)(i,"configuration.occupancies"));return u.forEach((function(e,n){return e.index=n})),(0,b.jsxs)(b.Fragment,{children:[(0,b.jsxs)(h.__,{children:[(0,b.jsx)("h3",{children:"Create Occupancy"}),(0,b.jsx)(w,{unit:t,editing:i,handleChange:a})]}),(0,b.jsxs)(h.__,{children:[(0,b.jsx)("h3",{children:"Temporary Occupancies"}),(0,b.jsx)("ul",{children:(0,v.isEmpty)(u.filter((function(e){return"delete"!==e.action})))?(0,b.jsx)("li",{children:"No Temporary Occupancies Defined"},"empty"):u.filter((function(e){return"delete"!==e.action})).sort((function(e,n){return M()(n.date).valueOf()-M()(e.date).valueOf()})).map((function(e,n){return(0,b.jsx)("li",{children:(0,b.jsx)(A,{path:"configuration.occupancies.".concat(e.index),unit:t,editing:i,occupancy:e,handleChange:a},e.index)},e.index)}))})]}),(0,b.jsx)(h.bZ,{intent:s.S.DANGER,isOpen:void 0!==l,confirmButtonText:"Yes",cancelButtonText:"Cancel",onConfirm:function(){var e;return d((0,_.VT)(null!==(e=null===l||void 0===l?void 0:l.id)&&void 0!==e?e:-1))},onClose:function(){return r(void 0)},children:(0,b.jsxs)("p",{children:["Permanently delete the occupancy ",null===l||void 0===l?void 0:l.label,"?"]})})]})}function $(e){var n=e.title,t=e.path,i=e.unit,a=e.editing,d=e.handleChange,o=e.readOnly,c=void 0===o?["title"]:o,l=(0,j.useCallback)((function(e){return(0,v.get)(a,e,(0,v.get)(i,e))}),[a,i]);return(0,b.jsxs)("div",{className:"row",children:[(0,b.jsx)("h3",{children:" "}),(0,b.jsx)("div",{className:"label",children:(0,b.jsxs)(h.__,{children:[(0,b.jsx)("b",{children:n}),(0,b.jsx)(h.BZ,{type:"text",value:l("".concat(t,".label")),onChange:function(e){d("".concat(t,".label"),a)(e.target.value)},readOnly:null===c||void 0===c?void 0:c.includes("title")})]})}),(0,b.jsx)("div",{className:"schedule",children:(0,b.jsx)(h.U2,{min:E.lL,max:E.QM,stepSize:5,labelStepSize:240,intent:s.S.SUCCESS,value:l("".concat(t,".occupied"))?[(0,E.xM)(l("".concat(t,".startTime")),!1),(0,E.xM)(l("".concat(t,".endTime")),!0)]:[E.lL,E.lL],labelRenderer:function(e,n){return null!==n&&void 0!==n&&n.isHandleTooltip||e>E.lL&&e<E.QM?(0,E.li)(e):""},disabled:(null===c||void 0===c?void 0:c.includes("occupied"))||!(0,v.get)(a,"".concat(t,".occupied"),(0,v.get)(i,"".concat(t,".occupied"))),onChange:function(e){var n=l("".concat(t,".occupied")),i=(0,v.clamp)(e[0],E.lL,Math.min(e[1],E.QM)-E.Ls),o=(0,v.clamp)(e[1],Math.max(e[0],E.lL)+E.Ls,E.QM),c=(0,E.sG)("all",{occupied:n,startTime:i,endTime:o});d("".concat(t),a)({startTime:(0,E.cz)(i),endTime:(0,E.cz)(o),label:c})}})}),(0,b.jsx)("div",{className:"unoccupied",children:(0,b.jsx)(h.XZ,{label:"Unoccupied",checked:!l("".concat(t,".occupied")),onClick:function(){var e=!l("".concat(t,".occupied")),n=(0,E.xM)(l("".concat(t,".startTime")),!1),i=(0,E.xM)(l("".concat(t,".endTime")),!0),o=(0,E.sG)("all",{occupied:e,startTime:n,endTime:i});d("".concat(t),a)({occupied:e,label:o})},disabled:null===c||void 0===c?void 0:c.includes("unoccupied")})})]})}U.label=(0,E.sG)("all",U);var H=(0,L.parseBoolean)(null!==(B="false")?B:"");function Y(e){var n=e.unit,t=e.editing,i=e.handleChange,a=e.readOnly;return(0,b.jsxs)(b.Fragment,{children:[(0,b.jsx)($,{title:"Monday Schedule",path:"configuration.mondaySchedule",unit:n,editing:t,handleChange:i,readOnly:a?["title","occupied","unoccupied"]:void 0}),(0,b.jsx)($,{title:"Tuesday Schedule",path:"configuration.tuesdaySchedule",unit:n,editing:t,handleChange:i,readOnly:a?["title","occupied","unoccupied"]:void 0}),(0,b.jsx)($,{title:"Wednesday Schedule",path:"configuration.wednesdaySchedule",unit:n,editing:t,handleChange:i,readOnly:a?["title","occupied","unoccupied"]:void 0}),(0,b.jsx)($,{title:"Thursday Schedule",path:"configuration.thursdaySchedule",unit:n,editing:t,handleChange:i,readOnly:a?["title","occupied","unoccupied"]:void 0}),(0,b.jsx)($,{title:"Friday Schedule",path:"configuration.fridaySchedule",unit:n,editing:t,handleChange:i,readOnly:a?["title","occupied","unoccupied"]:void 0}),(0,b.jsx)($,{title:"Saturday Schedule",path:"configuration.saturdaySchedule",unit:n,editing:t,handleChange:i,readOnly:a?["title","occupied","unoccupied"]:void 0}),(0,b.jsx)($,{title:"Sunday Schedule",path:"configuration.sundaySchedule",unit:n,editing:t,handleChange:i,readOnly:a?["title","occupied","unoccupied"]:void 0}),H&&(0,b.jsx)($,{title:"Holiday Schedule",path:"configuration.holidaySchedule",unit:n,editing:t,handleChange:i,readOnly:a?["title","occupied","unoccupied"]:void 0})]})}var G=t(49107);function K(e){var n=e.type,t=e.title,i=e.path,a=e.unit,d=e.editing,o=e.setpoint,c=e.handleChange,l=e.readOnly,r=void 0===l?["title"]:l,u=(0,j.useCallback)((function(e){return(0,v.get)(d,e,(0,v.get)(a,e))}),[d,a]),p=(0,j.useMemo)((function(){return(0,G.qr)((0,v.merge)({},(0,v.get)(a,i),o))||"\xa0"}),[i,a,o]),x=function(){return(0,b.jsxs)(h.Zz,{min:G.QG,max:G.Of,stepSize:.5,labelStepSize:5,labelRenderer:function(e,n){return null!==n&&void 0!==n&&n.isHandleTooltip||e>G.op&&e<G.Ig?"".concat(e,"\xba\xa0F"):""},children:[(0,b.jsx)(h.Zz.Handle,{type:h.gZ.START,interactionKind:h.qB.LOCK,intentAfter:s.S.WARNING,value:u("".concat(i,".heating")),onChange:function(e){var n=u("".concat(i,".setpoint")),t=u("".concat(i,".deadband")),a=G.ax+t/2,o=(0,v.clamp)(e,G.op,n-a),l=u("".concat(i,".cooling")),r=(0,G.hD)("all",{setpoint:n,deadband:t,heating:o,cooling:l});c("".concat(i),d)({heating:o,label:r})}}),(0,b.jsx)(h.Zz.Handle,{type:h.gZ.START,interactionKind:h.qB.LOCK,intentAfter:s.S.NONE,value:u("".concat(i,".setpoint"))-u("".concat(i,".deadband"))/2,onChange:function(e){var n=u("".concat(i,".deadband")),t=G.ax+n/2,a=u("".concat(i,".heating")),o=u("".concat(i,".cooling")),l=e+n/2,r=(0,v.clamp)(l,a+t,o-t),s=(0,G.hD)("all",{setpoint:r,deadband:n,heating:a,cooling:o});c("".concat(i),d)({setpoint:r,label:s})}}),(0,b.jsx)(h.Zz.Handle,{type:h.gZ.END,interactionKind:h.qB.LOCK,intentBefore:s.S.NONE,value:u("".concat(i,".setpoint"))+u("".concat(i,".deadband"))/2,onChange:function(e){var n=u("".concat(i,".deadband")),t=G.ax+n/2,a=u("".concat(i,".heating")),o=u("".concat(i,".cooling")),l=e-n/2,r=(0,v.clamp)(l,a+t,o-t),s=(0,G.hD)("all",{setpoint:r,deadband:n,heating:a,cooling:o});c("".concat(i),d)({setpoint:r,label:s})}}),(0,b.jsx)(h.Zz.Handle,{type:h.gZ.END,interactionKind:h.qB.LOCK,intentBefore:s.S.PRIMARY,value:u("".concat(i,".cooling")),onChange:function(e){var n=u("".concat(i,".setpoint")),t=u("".concat(i,".deadband")),a=G.ax+t/2,o=u("".concat(i,".heating")),l=(0,v.clamp)(e,n+a,G.Ig),r=(0,G.hD)("all",{setpoint:n,deadband:t,heating:o,cooling:l});c("".concat(i),d)({cooling:l,label:r})}})]})},f=function(){return(0,b.jsxs)(h.__,{children:[(0,b.jsx)("b",{children:"Occupied"}),(0,b.jsxs)(h.Zz,{min:G.QG,max:G.Of,stepSize:.5,labelStepSize:5,intent:s.S.SUCCESS,labelRenderer:function(e,n){return null!==n&&void 0!==n&&n.isHandleTooltip||e>G.op&&e<G.Ig?"".concat(e,"\xba\xa0F"):""},children:[(0,b.jsx)(h.Zz.Handle,{type:h.gZ.START,interactionKind:h.qB.LOCK,intentBefore:s.S.WARNING,intentAfter:s.S.SUCCESS,value:u("".concat(i,".setpoint"))-u("".concat(i,".deadband"))/2,onChange:function(e){var n=u("".concat(i,".deadband")),t=G.ax+n/2,a=u("".concat(i,".heating")),o=u("".concat(i,".cooling")),l=e+n/2,r=(0,v.clamp)(l,a+t,o-t),s=(0,G.hD)("all",{setpoint:r,deadband:n,heating:a,cooling:o});c("".concat(i),d)({setpoint:r,label:s})}}),(0,b.jsx)(h.Zz.Handle,{type:h.gZ.END,interactionKind:h.qB.LOCK,intentBefore:s.S.SUCCESS,intentAfter:s.S.PRIMARY,value:u("".concat(i,".setpoint"))+u("".concat(i,".deadband"))/2,onChange:function(e){var n=u("".concat(i,".deadband")),t=G.ax+n/2,a=u("".concat(i,".heating")),o=u("".concat(i,".cooling")),l=e-n/2,r=(0,v.clamp)(l,a+t,o-t),s=(0,G.hD)("all",{setpoint:r,deadband:n,heating:a,cooling:o});c("".concat(i),d)({setpoint:r,label:s})}})]})]})},g=function(){return(0,b.jsxs)(h.__,{children:[(0,b.jsx)("b",{children:"Unoccupied"}),(0,b.jsxs)(h.Zz,{min:G.QG,max:G.Of,stepSize:.5,labelStepSize:5,labelRenderer:function(e,n){return null!==n&&void 0!==n&&n.isHandleTooltip||e>G.op&&e<G.Ig?"".concat(e,"\xba\xa0F"):""},children:[(0,b.jsx)(h.Zz.Handle,{type:h.gZ.START,interactionKind:h.qB.LOCK,intentBefore:s.S.WARNING,value:u("".concat(i,".heating")),onChange:function(e){var n=u("".concat(i,".setpoint")),t=u("".concat(i,".deadband")),a=G.ax+t/2,o=(0,v.clamp)(e,G.op,n-a),l=u("".concat(i,".cooling")),r=(0,G.hD)("all",{setpoint:n,deadband:t,heating:o,cooling:l});c("".concat(i),d)({heating:o,label:r})}}),(0,b.jsx)(h.Zz.Handle,{type:h.gZ.END,interactionKind:h.qB.LOCK,intentAfter:s.S.PRIMARY,value:u("".concat(i,".cooling")),onChange:function(e){var n=u("".concat(i,".setpoint")),t=u("".concat(i,".deadband")),a=G.ax+t/2,o=u("".concat(i,".heating")),l=(0,v.clamp)(e,n+a,G.Ig),r=(0,G.hD)("all",{setpoint:n,deadband:t,heating:o,cooling:l});c("".concat(i),d)({cooling:l,label:r})}})]})]})};return(0,b.jsxs)(b.Fragment,{children:[(0,b.jsxs)("div",{className:"row",children:[(0,b.jsx)("h3",{children:" "}),(0,b.jsx)("div",{className:"label",children:(0,b.jsxs)(h.__,{children:[(0,b.jsx)("b",{children:t}),(0,b.jsx)(h.BZ,{type:"text",value:u("".concat(i,".label")),onChange:function(e){c("".concat(i,".label"),d)(e.target.value)},readOnly:null===r||void 0===r?void 0:r.includes("title")})]})}),(0,b.jsx)("div",{className:"deadband",children:(0,b.jsxs)(h.__,{children:[(0,b.jsx)("b",{children:"Deadband"}),(0,b.jsx)(h.Af,{step:1,min:G.bM,max:G.iz,value:u("".concat(i,".deadband")),onValueChange:function(e){var n=u("".concat(i,".setpoint")),t=e,a=u("".concat(i,".heating")),o=u("".concat(i,".cooling")),l=(0,G.hD)("all",{setpoint:n,deadband:t,heating:a,cooling:o});c("".concat(i),d)({deadband:t,label:l})}})]})}),(0,b.jsx)("div",{className:"error",children:(0,b.jsx)("h4",{children:p})}),(0,b.jsx)("div",{})]}),function(){switch(n){case"both":return(0,b.jsxs)("div",{className:"row",children:[(0,b.jsx)("div",{className:"setpoint",children:x()}),(0,b.jsx)("div",{className:"break"}),(0,b.jsx)("div",{className:"setpoint",children:f()}),(0,b.jsx)("div",{className:"break"}),(0,b.jsx)("div",{className:"setpoint",children:g()}),(0,b.jsx)("div",{className:"break"}),(0,b.jsx)("div",{})]});case"single":return(0,b.jsxs)("div",{className:"row",children:[(0,b.jsx)("div",{className:"setpoint",children:x()}),(0,b.jsx)("div",{className:"break"}),(0,b.jsx)("div",{})]});default:return(0,b.jsxs)("div",{className:"row",children:[(0,b.jsx)("div",{className:"setpoint",children:f()}),(0,b.jsx)("div",{className:"break"}),(0,b.jsx)("div",{className:"setpoint",children:g()}),(0,b.jsx)("div",{className:"break"}),(0,b.jsx)("div",{})]})}}()]})}function Q(e){var n=e.unit,t=e.editing,i=e.handleChange;return(0,b.jsx)(K,{type:"separate",title:"Setpoints",path:"configuration.setpoint",unit:n,editing:t,setpoint:(0,v.get)(t,"configuration.setpoint"),handleChange:i})}var q=t(95785),F=t(53381),W=t(77848),V=t(24824),X=t(89521),J=function(e){(0,l.Z)(t,e);var n=(0,r.Z)(t);function t(e){var i;return(0,o.Z)(this,t),(i=n.call(this,e)).getValue=function(e,n,t){var a=i.props.units,d=t||(null===a||void 0===a?void 0:a.find((function(e){return e.id===(null===n||void 0===n?void 0:n.id)})));return(0,v.get)(n,e,(0,v.get)(d,e))},i.handleChange=function(e,n){return function(t){if("configurationId"===e)i.props.updateUnit({id:null===n||void 0===n?void 0:n.id,configurationId:t});else!function(t){n&&((0,v.isObject)(i.getValue(e,n))?(0,v.set)(n,e,(0,v.merge)((0,v.cloneDeep)((0,v.get)(n,e)),t)):(0,v.set)(n,e,t),i.setState({editing:n}))}(t)}},i.handleCreate=function(e){var n=(0,W.ER)();n.unitId=e.id,i.props.createConfiguration(n),i.setState({editing:null,expanded:null})},i.handleEdit=function(e){var n=i.props.filtered,t=i.state.editing,a=t&&(null===n||void 0===n?void 0:n.find((function(e){return e.id===t.id})));a&&i.isSave(a)?i.setState({confirm:function(){return i.setState({editing:{id:e.id}})}}):i.setState({editing:{id:e.id}})},i.handleCancel=function(){var e=i.props.filtered,n=i.state.editing,t=n&&(null===e||void 0===e?void 0:e.find((function(e){return e.id===n.id})));t&&i.isSave(t)?i.setState({confirm:function(){return i.setState({editing:null,expanded:null})}}):i.setState({editing:null,expanded:null})},i.handleConfirm=function(){var e=i.state.confirm;i.setState({confirm:null},null!==e&&void 0!==e?e:void 0)},i.handleSave=function(){var e=i.state.editing;e&&i.props.updateUnit(e)},i.handleDelete=function(e){var n=e.id;void 0!==n&&i.props.deleteConfiguration(n)},i.handlePush=function(e){var n=e.id;void 0!==n&&i.props.updateUnit({id:n,stage:C.$b.UpdateType.label})},i.isSave=function(e){var n,t=i.state.editing,a=(0,v.merge)({},e,t);return(0,G.hQ)(null===(n=a.configuration)||void 0===n?void 0:n.setpoint)&&!(0,v.isEqual)(e,a)},i.isPush=function(e){switch(e.stage){case C.$b.UpdateType.label:case C.$b.DeleteType.label:case C.$b.ProcessType.label:return!1;case C.$b.CreateType.label:case C.$b.CompleteType.label:case C.$b.FailType.label:default:return!i.isSave(e)}},i.state={editing:null,expanded:null,confirm:null},i}return(0,c.Z)(t,[{key:"componentDidMount",value:function(){this.props.readUnits(),this.props.readConfigurations(),this.props.readUnitsPoll(V.Jd),this.props.readConfigurationsPoll(V.Jd)}},{key:"componentWillUnmount",value:function(){this.props.readUnitsPoll(),this.props.readConfigurationsPoll()}},{key:"isAdmin",value:function(){var e,n,t=this.props.user;return(e=C.GD.Admin).granted.apply(e,(0,d.Z)(null!==(n=null===t||void 0===t?void 0:t.role.split(" "))&&void 0!==n?n:[""]))}},{key:"renderStatus",value:function(e){var n=this,t=g.WNC,i=s.S.WARNING;switch(e.stage){case C.$b.UpdateType.label:t=g.RGM,i=s.S.PRIMARY;break;case C.$b.ProcessType.label:t=g.RGM,i=s.S.SUCCESS;break;case C.$b.CreateType.label:t=g.WNC,i=s.S.WARNING;break;case C.$b.DeleteType.label:t=g.yY6,i=s.S.DANGER;break;case C.$b.CompleteType.label:t=g.ae_,i=s.S.SUCCESS;break;case C.$b.FailType.label:t=g.pnR,i=s.S.DANGER}return(0,b.jsx)(q.u,{content:"Push Unit Configuration",placement:u.Ly.TOP,disabled:!this.isPush(e),children:(0,b.jsx)(h.zx,{icon:t,intent:i,minimal:!0,onClick:function(){return n.handlePush(e)},disabled:!this.isPush(e)})})}},{key:"renderConfirm",value:function(){var e=this;return null===this.state.confirm?null:(0,b.jsx)(h.bZ,{intent:s.S.DANGER,isOpen:!0,confirmButtonText:"Yes",cancelButtonText:"Cancel",onConfirm:function(){return e.handleConfirm()},onClose:function(){return e.setState({confirm:null})},children:(0,b.jsx)("p",{children:"There are changes which have not been saved. Do you still want to continue?"})})}},{key:"renderPrompt",value:function(){var e=this.props.filtered,n=this.state.editing,t=n&&(null===e||void 0===e?void 0:e.find((function(e){return e.id===n.id}))),i=!(0,v.isNil)(t)&&this.isSave(t);return(0,b.jsx)(p.NL,{when:i,message:"There are changes which have not been saved. Do you still want to continue?"})}},{key:"render",value:function(){var e=this,n=this.props,t=n.filtered,a=n.configurations,d=this.state,o=d.editing,c=d.expanded;return(0,b.jsxs)("div",{className:"units",children:[this.renderPrompt(),(0,b.jsx)(p.h4,(0,i.Z)({},this.props)),(0,b.jsx)("h1",{children:"Units"}),(0,b.jsxs)("div",{className:"list",children:[null===t||void 0===t?void 0:t.map((function(n,t){var i,d;return n.id===(null===o||void 0===o?void 0:o.id)?(0,b.jsxs)(h.Zb,{interactive:!0,children:[(0,b.jsxs)("div",{className:"row",children:[(0,b.jsx)("div",{children:(0,b.jsx)(h.__,{children:(0,b.jsx)("h3",{children:n.label})})}),(0,b.jsxs)("div",{children:[e.renderStatus(n),(0,b.jsx)(q.u,{content:"Save",placement:u.Ly.TOP,disabled:!e.isSave(n),children:(0,b.jsx)(h.zx,{icon:g.$eC,intent:s.S.PRIMARY,minimal:!0,onClick:function(){return e.handleSave()},disabled:!e.isSave(n)})}),(0,b.jsx)(q.u,{content:"Exit",placement:u.Ly.TOP,children:(0,b.jsx)(h.zx,{icon:g.eV6,intent:s.S.PRIMARY,minimal:!0,onClick:function(){return e.handleCancel()}})})]})]}),(0,b.jsxs)("div",{className:"row",children:[(0,b.jsx)("div",{children:(0,b.jsxs)(h.__,{children:[(0,b.jsx)("b",{children:"Campus"}),(0,b.jsx)(h.BZ,{type:"text",value:n.campus,readOnly:!0})]})}),(0,b.jsx)("div",{children:(0,b.jsxs)(h.__,{children:[(0,b.jsx)("b",{children:"Building"}),(0,b.jsx)(h.BZ,{type:"text",value:n.building,readOnly:!0})]})}),(0,b.jsx)("div",{children:(0,b.jsxs)(h.__,{children:[(0,b.jsx)("b",{children:"System"}),(0,b.jsx)(h.BZ,{type:"text",value:n.system,readOnly:!0})]})}),(0,b.jsx)("div",{children:(0,b.jsxs)(h.__,{children:[(0,b.jsx)("b",{children:"Timezone"}),(0,b.jsx)(h.BZ,{type:"text",value:n.timezone,readOnly:!0})]})}),(0,b.jsx)("div",{})]}),(0,b.jsxs)(h.UO,{isOpen:!0,children:[(0,b.jsx)(h.mp,{contents:[{id:"configuration",label:"Configuration",icon:g.$qo,hasCaret:!0,isExpanded:"configuration"===c}],onNodeExpand:function(n){return e.setState({expanded:n.id})},onNodeCollapse:function(){return e.setState({expanded:null})},onNodeClick:function(n){return e.setState({expanded:n.id===c?null:n.id})}}),(0,b.jsx)(h.UO,{isOpen:"configuration"===c,children:(0,b.jsx)(y,{unit:n,editing:o,configurations:a,handleChange:e.handleChange,handleCreate:e.handleCreate,readOnly:!e.isAdmin()})}),(0,b.jsx)(h.mp,{contents:[{id:"setpoints",label:"Setpoints",icon:g.IXo,hasCaret:!0,isExpanded:"setpoints"===c}],onNodeExpand:function(n){return e.setState({expanded:n.id})},onNodeCollapse:function(){return e.setState({expanded:null})},onNodeClick:function(n){return e.setState({expanded:n.id===c?null:n.id})}}),(0,b.jsx)(h.UO,{isOpen:"setpoints"===c,children:(0,b.jsx)(Q,{unit:n,editing:o,handleChange:e.handleChange})}),(0,b.jsx)(h.mp,{contents:[{id:"schedules",label:"Occupancy Schedules",icon:g.nfX,hasCaret:!0,isExpanded:"schedules"===c}],onNodeExpand:function(n){return e.setState({expanded:n.id})},onNodeCollapse:function(){return e.setState({expanded:null})},onNodeClick:function(n){return e.setState({expanded:n.id===c?null:n.id})}}),(0,b.jsx)(h.UO,{isOpen:"schedules"===c,children:(0,b.jsx)(Y,{unit:n,editing:o,handleChange:e.handleChange,readOnly:!e.isAdmin()})}),(0,b.jsx)(h.mp,{contents:[{id:"holidays",label:"Holidays",icon:g.q4R,hasCaret:!0,isExpanded:"holidays"===c}],onNodeExpand:function(n){return e.setState({expanded:n.id})},onNodeCollapse:function(){return e.setState({expanded:null})},onNodeClick:function(n){return e.setState({expanded:n.id===c?null:n.id})}}),(0,b.jsx)(h.UO,{isOpen:"holidays"===c,children:(0,b.jsx)(z,{unit:n,editing:o,handleChange:e.handleChange,readOnly:!e.isAdmin()})}),(0,b.jsx)(h.mp,{contents:[{id:"occupancies",label:"Temporary Occupancy",icon:g.SdJ,hasCaret:!0,isExpanded:"occupancies"===c}],onNodeExpand:function(n){return e.setState({expanded:n.id})},onNodeCollapse:function(){return e.setState({expanded:null})},onNodeClick:function(n){return e.setState({expanded:n.id===c?null:n.id})}}),(0,b.jsx)(h.UO,{isOpen:"occupancies"===c,children:(0,b.jsx)(I,{unit:n,editing:o,handleChange:e.handleChange})}),(0,b.jsx)(h.mp,{contents:[{id:"rtu",label:"RTU Configuration",icon:g.lt1,hasCaret:!0,isExpanded:"rtu"===c}],onNodeExpand:function(n){return e.setState({expanded:n.id})},onNodeCollapse:function(){return e.setState({expanded:null})},onNodeClick:function(n){return e.setState({expanded:n.id===c?null:n.id})}}),(0,b.jsx)(h.UO,{isOpen:"rtu"===c,children:(0,b.jsx)(F.f,{unit:n,editing:o,handleChange:e.handleChange,hidden:e.isAdmin()?["peakLoadExclude","coolingPeakOffset","heatingPeakOffset","zoneLocation","zoneMass","zoneOrientation","zoneBuilding","coolingCapacity","compressors","heatPumpBackup"]:["location","peakLoadExclude","coolingPeakOffset","heatingPeakOffset","zoneLocation","zoneMass","zoneOrientation","zoneBuilding","coolingCapacity","compressors","optimalStartLockout","optimalStartDeviation","earliestStart","latestStart","heatPump","heatPumpBackup","heatPumpLockout","economizer","economizerSetpoint","coolingLockout"]})})]})]},null!==(i=n.id)&&void 0!==i?i:t):(0,b.jsx)(h.Zb,{interactive:!0,children:(0,b.jsxs)("div",{className:"row",children:[(0,b.jsx)("div",{children:(0,b.jsx)(h.__,{children:(0,b.jsx)("h3",{children:n.label})})}),(0,b.jsxs)("div",{children:[e.renderStatus(n),(0,b.jsx)(q.u,{content:"Edit",placement:u.Ly.TOP,children:(0,b.jsx)(h.zx,{icon:g.dme,intent:s.S.PRIMARY,minimal:!0,onClick:function(){return e.handleEdit(n)}})})]})]})},null!==(d=n.id)&&void 0!==d?d:t)})),this.renderConfirm()]})]})}}]),t}(j.Component),ee={readUnits:f.Vh,readUnitsPoll:f.j5,filterUnits:f.Oe,updateUnit:f.t1,readConfigurations:x.uu,readConfigurationsPoll:x.z2,createConfiguration:x.Gx,updateConfiguration:x.a3,deleteConfiguration:x.Xc,updateSetpoint:X.d8},ne=(0,D.$j)((function(e){return{units:(0,f.OB)(e),filtered:(0,f.ey)(e),configurations:(0,x.yp)(e)}}),ee)(J),te=function(e){return(0,b.jsx)(a.Z,(0,i.Z)((0,i.Z)({},e),{},{renderRoute:function(e){return(0,b.jsx)(ne,(0,i.Z)({},e))}}))}},77848:function(e,n,t){t.d(n,{LK:function(){return r},ER:function(){return u},kI:function(){return s}});var i=t(49107),a=t(63769),d=t(696),o=t(72426),c=t.n(o),l=t(763),r=function(e){return c()().format("dddd, MMMM Do YYYY")},s=function(e){return 0===(0,l.sum)(Object.values((null===e||void 0===e?void 0:e._count)||{}))},u=function(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:r(),n={label:"",setpoint:i.Qf,deadband:i.tz,heating:i.cF,cooling:i.tE};n.label=(0,i.hD)("all",n);var t={label:"",occupied:!0,startTime:(0,a.cz)(a.S$),endTime:(0,a.cz)(a.Be)};t.label=(0,a.sG)("all",t);var o={label:"",occupied:!1,startTime:(0,a.cz)(a.S$),endTime:(0,a.cz)(a.Be)};o.label=(0,a.sG)("all",o);var c=[d.R$.NewYearsDayType,d.R$.MartinLutherKingJrType,d.R$.PresidentsDayType,d.R$.MemorialDayType,d.R$.JuneteenthType,d.R$.IndependenceDayType,d.R$.LaborDayType,d.R$.ColumbusDayType,d.R$.VeteransDayType,d.R$.ThanksgivingType,d.R$.BlackFridayType,d.R$.ChristmasType].map((function(e){return e.name})),l=d.R$.values.map((function(e){return{label:e.label,type:c.includes(e.name)?"Enabled":"Disabled"}}));return{label:e,setpoint:n,mondaySchedule:t,tuesdaySchedule:t,wednesdaySchedule:t,thursdaySchedule:t,fridaySchedule:t,saturdaySchedule:o,sundaySchedule:o,holidaySchedule:o,holidays:l}}},63769:function(e,n,t){t.d(n,{Ls:function(){return o},lL:function(){return c},S$:function(){return l},QM:function(){return r},Be:function(){return s},cz:function(){return p},li:function(){return x},xM:function(){return f},sG:function(){return g}});var i=t(763),a=t(72426),d=t.n(a),o=120,c=0,l=480,r=1440,s=1080,u="HH:mm",h="h:mm\xa0a",p=function(e){return d()("00:00",[u]).add(Math.trunc(e/60),"hours").add(e%60,"minutes").format(u)},x=function(e){return d()("00:00",[u]).add(Math.trunc(e/60),"hours").add(e%60,"minutes").format(h)},f=function(e,n){return 60*function(e,n,t){return t&&0===e?n:e}(d()(e,[u,h]).hours(),24,n)+d()(e,[u,h]).minutes()},g=function(e,n){var t=void 0===(null===n||void 0===n?void 0:n.occupied)||n.occupied,a=(0,i.isNumber)(n.startTime)?n.startTime:f(n.startTime,!1),d=(0,i.isNumber)(n.endTime)?n.endTime:f(n.endTime,!0);switch(e){case"startTime":return"".concat(x(a));case"endTime":return"".concat(x(d));default:return t?0===a&&1440===d?"Occupied All Day":"Occupied From Start Time: ".concat(x(a)," To End Time: ").concat(x(d)):"Unoccupied All Day"}}},49107:function(e,n,t){t.d(n,{ax:function(){return p},bM:function(){return x},iz:function(){return f},tz:function(){return g},op:function(){return v},cF:function(){return m},Ig:function(){return j},tE:function(){return b},QG:function(){return y},Of:function(){return S},Qf:function(){return C},hD:function(){return N},qr:function(){return T},hQ:function(){return O}});var i,a,d,o,c,l,r,s,u=t(763),h=t(696),p=parseInt("2"),x=(null===(i=h.g9.DeadbandType.options)||void 0===i?void 0:i.min)||2,f=(null===(a=h.g9.DeadbandType.options)||void 0===a?void 0:a.max)||6,g=(null===(d=h.g9.DeadbandType.options)||void 0===d?void 0:d.default)||4,v=(null===(o=h.g9.HeatingType.options)||void 0===o?void 0:o.min)||55,m=(null===(c=h.g9.HeatingType.options)||void 0===c?void 0:c.default)||60,j=(null===(l=h.g9.CoolingType.options)||void 0===l?void 0:l.max)||85,b=(null===(r=h.g9.CoolingType.options)||void 0===r?void 0:r.default)||80,y=v,S=j,C=(null===(s=h.g9.SetpointType.options)||void 0===s?void 0:s.default)||70,N=function e(n,t){return"all"===n?"Occupied Setpoint: ".concat(e("setpoint",t)," Deadband: ").concat(e("deadband",t)," Unoccupied Heating: ").concat(e("heating",t)," Cooling: ").concat(e("cooling",t)):"".concat(t[n],"\xba\xa0F")},T=function(e){return e.deadband<x||e.deadband>f?"Deadband must be in the range [".concat(x,",").concat(f,"]."):e.setpoint<e.heating+p+e.deadband/2||e.setpoint>e.cooling-p-e.deadband/2?"Occupied setpoint must be in the range [".concat(e.heating+p+e.deadband/2,",").concat(e.cooling-p-e.deadband/2,"]"):e.heating<v||e.cooling>j?"Unoccupied heating and cooling must be in the range [".concat(v,",").concat(j,"]"):e.setpoint%.5!==0?"Occupied setpoint must be a whole or half degree.":e.deadband%1!==0?"Deadband must be a whole degree.":e.heating%.5!==0||e.cooling%.5!==0?"Unoccupied heating or cooling must be a whole or half degree.":void 0},O=function(e){return!!(e&&(0,u.isNumber)(e.setpoint)&&(0,u.isNumber)(e.deadband)&&(0,u.isNumber)(e.heating)&&(0,u.isNumber)(e.cooling))&&void 0===T(e)}}}]);
//# sourceMappingURL=212.5e81b0af.chunk.js.map