<?php

namespace app\admin\controller\points;

use app\common\controller\Backend;
use app\admin\model\PointsCodeBatch as BatchModel;
use app\admin\model\PointsCode as CodeModel;
use app\admin\model\PointsMallItem;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use PhpOffice\PhpSpreadsheet\Reader\Xls;
use PhpOffice\PhpSpreadsheet\Reader\Xlsx;

/**
 * 虚拟券码批次管理
 *
 * @icon fa fa-database
 */
class Codebatch extends Backend
{
    /**
     * @var BatchModel
     */
    protected $model = null;

    public function _initialize()
    {
        parent::_initialize();
        $this->model = new BatchModel;
        $virtualItems = PointsMallItem::where('type', 'virtual')->order('id', 'asc')->select();
        $this->view->assign('virtualItems', $virtualItems);
    }

    /**
     * 新增批次时，支持在表单中粘贴多行券码，自动写入明细表
     */
    public function add()
    {
        if ($this->request->isPost()) {
            $params = $this->request->post('row/a');
            if (!$params || empty($params['item_id'])) {
                $this->error(__('Parameter %s can not be empty', 'row'));
            }

            // 优先从上传的文件中读取券码，如果未上传文件则兼容旧的多行文本方式
            $codes = [];
            $filePath = isset($params['file']) ? trim($params['file']) : '';

            if ($filePath !== '') {
                // 兼容三种输入：
                // 1) 完整 URL: http://127.0.0.1:8000/uploads/xxx.xlsx
                // 2) 站内绝对路径: /uploads/xxx.xlsx
                // 3) 相对路径: uploads/xxx.xlsx
                $rawPath = $filePath;
                if (preg_match('/^https?:\/\//i', $rawPath)) {
                    $parsed = parse_url($rawPath, PHP_URL_PATH);
                    $rawPath = is_string($parsed) ? $parsed : '';
                }
                $rawPath = trim($rawPath);
                if ($rawPath === '') {
                    $this->error('券码文件路径无效，请重新上传');
                }
                if (strpos($rawPath, '/uploads/') === 0) {
                    $realPath = ROOT_PATH . 'public' . $rawPath;
                } elseif (strpos($rawPath, 'uploads/') === 0) {
                    $realPath = ROOT_PATH . 'public/' . $rawPath;
                } else {
                    $realPath = ROOT_PATH . 'public/uploads/' . ltrim($rawPath, '/');
                }
                if (!is_file($realPath)) {
                    $this->error('券码文件不存在，请重新上传');
                }
                $ext = strtolower(pathinfo($realPath, PATHINFO_EXTENSION));
                // 纯文本/CSV：每行一条券码
                if (in_array($ext, ['txt', 'csv'])) {
                    $lines = file($realPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
                    foreach ($lines as $line) {
                        $code = trim($line);
                        if ($code !== '') {
                            $codes[] = $code;
                        }
                    }
                // Excel：从“券码”这一列读取
                } elseif (in_array($ext, ['xlsx', 'xls'])) {
                    $reader = $ext === 'xlsx' ? new Xlsx() : new Xls();
                    try {
                        $spreadsheet = $reader->load($realPath);
                    } catch (\Throwable $e) {
                        $this->error('无法读取 Excel 文件：' . $e->getMessage());
                    }
                    $sheet = $spreadsheet->getSheet(0);
                    $allColumn = $sheet->getHighestDataColumn();
                    $allRow = $sheet->getHighestRow();
                    $maxColumnNumber = Coordinate::columnIndexFromString($allColumn);

                    // 在首行中查找包含“券码”文字或等于 code 的列
                    $codeColumnIndex = null;
                    for ($currentColumn = 1; $currentColumn <= $maxColumnNumber; $currentColumn++) {
                        $header = trim((string)$sheet->getCellByColumnAndRow($currentColumn, 1)->getValue());
                        if ($header === '') {
                            continue;
                        }
                        if (mb_strpos($header, '券码') !== false || strtolower($header) === 'code') {
                            $codeColumnIndex = $currentColumn;
                            break;
                        }
                    }
                    if (!$codeColumnIndex) {
                        $this->error('Excel 首行未找到“券码”列，请确认表头名称包含“券码”或为 code');
                    }
                    // 读取数据行
                    for ($currentRow = 2; $currentRow <= $allRow; $currentRow++) {
                        $val = $sheet->getCellByColumnAndRow($codeColumnIndex, $currentRow)->getValue();
                        $code = trim((string)$val);
                        if ($code !== '') {
                            $codes[] = $code;
                        }
                    }
                } else {
                    $this->error('当前仅支持 txt/csv/xls/xlsx 文件，请检查上传格式');
                }
                // 如果未填写文件名说明，则默认使用上传文件名
                if (empty($params['filename'])) {
                    $params['filename'] = basename($realPath);
                }
            } else {
                // 兼容旧表单中的多行券码文本
                $codesText = $this->request->post('codes_text', '');
                foreach (preg_split("/\r\n|\n|\r/", $codesText) as $line) {
                    $code = trim($line);
                    if ($code !== '') {
                        $codes[] = $code;
                    }
                }
            }

            if (empty($codes)) {
                $this->error('请通过上传文件或填写文本提供至少一条券码');
            }

            // 1) 文件内去重，避免同批次重复导致唯一索引冲突
            $codes = array_values(array_unique($codes));
            // 2) 跳过数据库中已存在的券码（fa_points_codes.code 全局唯一）
            $existingCodes = (new CodeModel)
                ->where('code', 'in', $codes)
                ->column('code');
            if (!empty($existingCodes)) {
                $existsMap = array_flip($existingCodes);
                $codes = array_values(array_filter($codes, function ($code) use ($existsMap) {
                    return !isset($existsMap[$code]);
                }));
            }
            if (empty($codes)) {
                $this->error('导入失败：本次文件中的券码均已存在，请更换新券码后重试');
            }

            $itemId = (int)$params['item_id'];
            $item = PointsMallItem::get($itemId);
            if (!$item || $item['type'] !== 'virtual') {
                $this->error('只允许为虚拟商品创建券码批次');
            }
            // 券码数量必须与虚拟商品库存严格一致
            if ((int)$item['stock'] !== count($codes)) {
                $this->error('券码数与库存不符');
            }

            $time = time();
            $batchCode = $params['batch_code'] ?? '';
            if ($batchCode === '') {
                $maxId = $this->model->max('id');
                $next = (int)$maxId + 1;
                $batchCode = sprintf('B%03d', $next);
            }

            $batchData = [
                'batch_code' => $batchCode,
                'item_id'    => $itemId,
                'item_name'  => $item['name'],
                'filename'   => $params['filename'] ?? '',
                'total'      => count($codes),
                'used'       => 0,
                'createtime' => $time,
            ];

            $this->model->startTrans();
            try {
                $batch = $this->model->create($batchData, true);
                $batchId = $batch['id'];

                $codeRows = [];
                foreach ($codes as $code) {
                    $codeRows[] = [
                        'batch_id' => $batchId,
                        'item_id'  => $itemId,
                        'code'     => $code,
                        'expire_at'=> !empty($params['expire_at']) ? $params['expire_at'] : null,
                        'remark'   => $params['remark'] ?? '',
                        'status'   => 'unused',
                        'record_id'=> 0,
                        'used_at'  => null,
                    ];
                }
                if (!empty($codeRows)) {
                    (new CodeModel)->saveAll($codeRows);
                }

                $this->model->commit();
            } catch (\Throwable $e) {
                $this->model->rollback();
                $this->error($e->getMessage());
            }

            $this->success('券码导入成功');
        }

        return parent::add();
    }
}

