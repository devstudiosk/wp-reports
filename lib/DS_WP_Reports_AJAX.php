<?php

/**
 * AJAX request handler.
 * 
 * @author Martin Krcho <martin.krcho@devstudio.sk>
 * @since 1.0.0
 */
class DS_WP_Reports_AJAX {

	public static function __init() {

		add_action('wp_ajax_' . DS_WP_Reports_Core::AJAX_ACTION_REPORT_SETUP, array(__CLASS__, 'handleReportSetupCall'));
		add_action('wp_ajax_' . DS_WP_Reports_Core::AJAX_ACTION_REPORT_DATA, array(__CLASS__, 'handleReportDataCall'));

	}

	public static function handleReportSetupCall() {

		$reportId = array_key_exists('report_id', $_REQUEST) ? trim($_REQUEST['report_id']) : null;

		$result = true; //VS_SpeedTest_Model::updateLocationInfo($measureId, $address, $latitude, $longitude, $addressJSON);
		if (is_wp_error($result)) {
			wp_send_json_error($result->get_error_message());
		}

		wp_send_json_sucess();

	}

	public static function handleReportDataCall() {

		$reportId = array_key_exists('report_id', $_REQUEST) ? trim($_REQUEST['report_id']) : null;
		if ($reportId === null) {
			wp_send_json_error('Missing report ID');
		}

		$result = DS_WP_Reports_Core::executeReportDataHandler($reportId);

		if (is_wp_error($result)) {
			wp_send_json_error($result->get_error_message($result->get_error_code));
		}

		wp_send_json_sucess($result);

	}

}
