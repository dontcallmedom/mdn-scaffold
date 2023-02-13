---
title: <%= iface %>.<%= membername %>
slug: Web/API/<%= iface %>/<%= membername %>
page-type: web-api-<%
if (static) { %>static<% 
} else { %>instance<% 
} %>-property<% 
if (experimental) { %>
tags:
- experimental
<% } 
%>browser-compat: api.<%= iface %>.<%= membername %>
---
{{APIRef("<%=groupdataname%>")}}<% if (experimental) { 
%>{{SeeCompatTable}}<% 
} %><% if (securecontext) { 
%>{{SecureContext_Header}}<% } %>

The <% if (static) {%>static <% }%>**`<%= membername %>`** property of the {{DOMxRef("iface")}} interface TOWRITE: the end of the summary paragraph

## Value

TOWRITE: Include a description of the property's value, including data type and what it represents.

## Examples

TOWRITE: Write a short example demonstrating the use of this property. If not pertinent, delete the whole section

## Specifications

{{Specifications}}

## Browser compatibility

{{Compat}}

