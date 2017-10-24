<?php

/**
 * AJAX request handler.
 *
 * @author Martin Krcho <martin.krcho@devstudio.sk>
 * @since 1.0.0
 */
class DS_WP_Reports_AJAX {

	public static function init() {

		add_action('wp_ajax_' . DS_WP_Reports_Core::AJAX_ACTION_REPORT_SETUP, array(__CLASS__, 'handleReportSetupCall'), 10, 0);
		add_action('wp_ajax_' . DS_WP_Reports_Core::AJAX_ACTION_REPORT_DATA, array(__CLASS__, 'handleReportDataCall'), 10, 0);

	}

	public static function handleReportSetupCall() {

		$reportId = array_key_exists('report_id', $_REQUEST) ? trim($_REQUEST['report_id']) : NULL;
		$report = DS_WP_Reports_Core::getReportById($reportId);
		$result = $report;

		if (is_wp_error($result)) {
			wp_send_json_error($result->get_error_message());
		}

		unset($result['data_callback']);
		wp_send_json_success($result);

	}

	public static function handleReportDataCall() {

		$reportId = array_key_exists('report_id', $_REQUEST) ? trim($_REQUEST['report_id']) : NULL;
		if ($reportId === NULL) {
			wp_send_json_error('Missing report ID');
		}

		$reportData = DS_WP_Reports_Core::executeReportDataHandler($reportId);

		//	@todo check the data format

		if (is_wp_error($reportData)) {
			wp_send_json_error($reportData->get_error_message($reportData->get_error_code));
		}

		if (array_key_exists('export', $_REQUEST) && $_REQUEST['export'] === 'csv') {

			$valuesToExport = $reportData['values'];

			$csvFile = fopen('php://output', 'w');

			header("Content-Disposition: attachment; filename=report.csv");
			header("Content-Type: text/csv");

			foreach ($valuesToExport as $dataValues => $value) {
				$exportValues = array();
				array_push($exportValues, $dataValues);

				foreach ($value as $separateValue) {
					array_push($exportValues, $separateValue);
				}

				fputcsv($csvFile, $exportValues);
			}

			fclose($csvFile);
			wp_send_json_success();

		}

		$visualizationType = array_key_exists('visualization', $_REQUEST) ? trim($_REQUEST['visualization']) : 'timeline';
		$result = array_merge($reportData, array(
			'visualization' => $visualizationType
		));
		wp_send_json_success($result);

	}

}
