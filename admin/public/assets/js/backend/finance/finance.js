define(['jquery', 'bootstrap', 'backend', 'table', 'form'], function ($, undefined, Backend, Table, Form) {

    var Controller = {
        index: function () {
            // 弹窗内新增/编辑成功后，require-form 会触发 .btn-refresh，刷新本页以同步流水列表
            $(document).off('click', '.btn-refresh').on('click', '.btn-refresh', function () {
                location.reload();
            });

            // 新增流水
            $(document).on('click', '.btn-add-flow', function () {
                Fast.api.open('finance/finance/add', '新增流水', {
                    area: ['800px', '520px']
                });
            });

            // 编辑流水
            $(document).on('click', '.btn-edit-flow', function () {
                var id = $(this).data('id');
                if (!id) {
                    return;
                }
                Fast.api.open('finance/finance/edit/ids/' + id, '编辑流水', {
                    area: ['800px', '520px']
                });
            });

            // 删除流水：成功后刷新本页以同步列表
            $(document).on('click', '.btn-del-flow', function () {
                var url = $(this).data('url');
                if (!url) return;
                Layer.confirm('确认删除该流水记录？', function (index) {
                    var data = {};
                    var token = $('input[name="__token__"]').val();
                    if (token) data.__token__ = token;
                    Backend.api.ajax({
                        url: url,
                        type: 'POST',
                        data: data
                    }, function () {
                        Layer.close(index);
                        Toastr.success('删除成功');
                        $('.btn-refresh').trigger('click');
                    }, function (ret) {
                        Layer.close(index);
                        Toastr.error(ret.msg || '删除失败');
                    });
                });
                return false;
            });
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

