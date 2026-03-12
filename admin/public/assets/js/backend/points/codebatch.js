define(['jquery', 'bootstrap', 'backend', 'table', 'form'], function ($, undefined, Backend, Table, Form) {

    var Controller = {
        index: function () {
            Table.api.init({
                extend: {
                    index_url: 'points/codebatch/index',
                    add_url: 'points/codebatch/add',
                    del_url: 'points/codebatch/del',
                    table: 'points_code_batches',
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
                        {field: 'batch_code', title: __('Batch code'), operate: 'LIKE'},
                        {field: 'item_id', title: __('Item id'), operate: 'BETWEEN'},
                        {field: 'item_name', title: __('Item name'), operate: 'LIKE'},
                        {field: 'total', title: __('Total'), operate: 'BETWEEN'},
                        {field: 'used', title: __('Used'), operate: 'BETWEEN'},
                        {field: 'createtime', title: __('Createtime'), operate: 'RANGE', addclass: 'datetimerange', formatter: Table.api.formatter.datetime},
                        {field: 'operate', title: __('Operate'), table: table, events: Table.api.events.operate, formatter: Table.api.formatter.operate}
                    ]
                ]
            });

            Table.api.bindevent(table);
        },
        add: function () {
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

