define(['jquery', 'bootstrap', 'backend', 'table', 'form'], function ($, undefined, Backend, Table, Form) {

    var Controller = {
        index: function () {
            Table.api.init({
                extend: {
                    index_url: 'points/mallitem/index',
                    add_url: 'points/mallitem/add',
                    edit_url: 'points/mallitem/edit',
                    del_url: 'points/mallitem/del',
                    multi_url: 'points/mallitem/multi',
                    table: 'points_mall_items',
                }
            });

            var table = $("#table");

            table.bootstrapTable({
                url: $.fn.bootstrapTable.defaults.extend.index_url,
                pk: 'id',
                sortName: 'id',
                columns: [
                    [
                        {checkbox: true},
                        {field: 'id', title: __('Id'), sortable: true},
                        {field: 'name', title: __('Name'), operate: 'LIKE'},
                        {
                            field: 'type',
                            title: __('Type'),
                            searchList: {physical: __('Physical'), virtual: __('Virtual')},
                            formatter: Table.api.formatter.normal
                        },
                        {field: 'pointsRequired', title: __('Pointsrequired'), operate: 'BETWEEN'},
                        {field: 'stock', title: __('Stock'), operate: 'BETWEEN'},
                        {
                            field: 'status',
                            title: __('Status'),
                            searchList: {1: __('On'), 0: __('Off')},
                            formatter: Table.api.formatter.status
                        },
                        {field: 'operate', title: __('Operate'), table: table, events: Table.api.events.operate, formatter: Table.api.formatter.operate}
                    ]
                ]
            });

            Table.api.bindevent(table);
        },
        add: function () {
            Controller.api.bindevent();
        },
        edit: function () {
            Controller.api.bindevent();
        },
        api: {
            bindevent: function () {
                Form.api.bindevent($("form[role=form]"));
            }
        }
    };
    return Controller;
});

