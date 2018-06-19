<?php

namespace Drupal\finder\Controller;

use Drupal\Core\Controller\ControllerBase;
use \Drupal;
use \Drupal\taxonomy\Entity\Term;
use \Symfony\Component\HttpFoundation\JsonResponse;

class FinderController extends ControllerBase {

  /**
   * Display the markup.
   *
   * @return array
   */
  public function content() {
/*
    return array(
      '#type' => 'markup',
      '#markup' => $this->t('Hello, World!  From the Finder controller.'),
    );
*/

// assure that a session has been started, and then set the csrf_token





    return [
      '#theme' => 'finder',
      '#attached' => [
        'library' => [
          'finder/finder',
        ],
      ],
    ];
  }

/* Return a JSON representation of the facets tree
 * @return JsonResponse     the facet tree
 */

  private function createfacettree() {
   $terms=Drupal::entityTypeManager()
        ->getStorage('taxonomy_term')
        ->loadTree("facets", 0, null, true);
        //  $vid, $parent, $max_depth, $load_entities);

    // extract data for all of the terms
    foreach ($terms as $term) {

        if (sizeof($term->get('field_control_type')->getValue()) > 0) {
            $tid = $term->get('field_control_type')->getValue()[0]["target_id"];
            $control_type = Term::load($tid)->getName();
        } else {
            $control_type = null;
        }
        $term_data[] = [
            'id' => $term->tid->value,
            'name' => $term->name->value,
            "control_type" => $control_type,
            'parent' => $term->parents[0], // there will only be one
            'weight' => $term->weight->value,
            'selected' => false,
            'description' => $term->getDescription()
        ];
    }

    // find the questions and add choices array
    $questions = [];

    foreach ($term_data as $td) {
        if ($td["parent"] == "0") {
            $td["choices"] = [];
            array_push($questions, $td);
        }
    }

    $temp_questions = [];
    // get the facets for each of the questions
    foreach ($questions as $q) {
        foreach ($term_data as $td) {
            if ($td["parent"] == $q["id"]) {
                array_push($q["choices"], $td);
            }
        }
        // sort the choices by weight ascending
        $weight = [];
        foreach ($q["choices"] as $key=>$row){
            $weight[$key] = $row["weight"];
        }
        array_multisort($weight, SORT_ASC, $q["choices"]);
        array_push($temp_questions, $q);
    }

    $questions = $temp_questions;

    // sort the questions by weight
    $weight = [];
    foreach ($questions as $key=>$row) {
        $weight[$key] = $row["weight"]; // convert to number
    }
    array_multisort($weight, SORT_ASC, $questions);
    return $questions;

  }


  public function facettree() {

    $questions = $this->createfacettree();
    return new JsonResponse($questions);

  }


    private function createtestservicelist() {

        $values = [
            'type' => 'service'
        ];

        $nodes = Drupal::entityTypeManager()
            ->getListBuilder('node')
            ->getStorage()
            ->loadByProperties($values);

        $services = []; // where we will build the service data

// this is how to get the node info
  $display = \Drupal::entityTypeManager()
    ->getStorage('entity_view_display')
    ->load("node" . '.' . "service" . '.' . "default");

    //echo(json_encode($display->toArray())); echo"<br>";


        $paragraph_display = \Drupal::entityTypeManager()
        ->getStorage('entity_view_display')
        ->load("paragraph.service_paragraphs.default");
 //       ->load("paragraph" . '.' . "service_paragraphs" . '.' . "default");


        foreach ($nodes as $node) {

            $s = [];
            $s["id"] = $node->nid->value;
            $s["title"] = $node->title->value;
            // get the facet matches
            $s["facet_matches"] = [];
            foreach ($node->field_facet_matches as $match) {
                $s["facet_matches"][] = $match->target_id;
            }
            $s["summary"] = $node->field_summary->value;
            // get the service_paragraphs

            $paragraph = $node->get('field_service_paragraphs')->first();
            if ($paragraph) {
                $pdoutput = [];
                $paragraph = $paragraph->get('entity')->getTarget();
                //var_dump($paragraph); echo("<br>");

                // the order of the paragraphs is in $paragraph_display[
                // the fields are array_keys($paragraph_display["content"])
                // the weights are $paragraph_display["content"][$field]["weight"]
                //var_dump($paragraph_display); exit;
                $pdcontent = $paragraph_display->toArray()["content"];

                foreach ($pdcontent as $machine_name => $field_data) {
                    $field_data = [];
                    if (sizeof($paragraph->get($machine_name)->getValue())> 0) {
                        $field_data["value"] = $paragraph->get($machine_name)->getValue()[0]["value"];

                        //var_dump($paragraph->get($machine_name)->getValue()[0]["value"]); echo("<br>");
                    }
                    

                    $field_config = \Drupal::entityManager()->getStorage('field_config')->load("paragraph" . '.' . "service_paragraphs" . '.' . $machine_name)->toArray();

                    $field_data["label"] = $field_config["label"];
                    $field_data["weight"] = $pdcontent[$machine_name]["weight"];

                    $pdoutput[$machine_name] = $field_data;
                    //var_dump($field_data); exit;

                }
                $s["field_data"] = $pdoutput;
            }
                //echo(json_encode($s));


            //echo(json_encode($paragraph_display->toArray())); exit;

            array_push($services, $s);

        }

        $title = [];
        foreach ($services as $key=>$row){
            $title[$key] = $row["title"];
        }
        array_multisort($title, SORT_ASC, $services);   

        return $services;

    }

    public function servicelist() {
        $services = $this->createtestservicelist();      
        return new JsonResponse($services);
    }

    public function send_email() {

        if (\Drupal::service('session')->isStarted() === FALSE) {
            return new JsonResponse("no session, so sorry");
        }
        //$url = \Drupal::request()->getSchemeAndHttpHost().
        //        "/session/token";
        //$desiredtoken = $this->get_web_page($url);

        //$desired_token = session_id();
        //$desired_token = Drupal::csrfToken()->get();

        //$intoken = \Drupal::request()->headers->get("X-CSRF-Token");

        //return new JsonResponse(["want $desired_token got $intoken"]);

        // data include name, email, facets (string)
        $json_string = \Drupal::request()->getContent();
        //  \Drupal::logger('finder')->notice("email json is $json_string");

        $decoded = \Drupal\Component\Serialization\Json::decode($json_string);

        // get $qdata from $decoded
        $qdata = $decoded["qdata"];
        // get $sdata from $decoded
        $sdata = $decoded["sdata"];

        $body = "Thank you for using the Finder tool. " .
            "We hope it was useful.\r\n\r\n" .
            "Your selected criteria were:\r\n";

        $questions = $this->createfacettree();

        $facets = [];

        foreach ($qdata as $qitem) {
            $question_id = $qitem[0];
            $facet_id = $qitem[1];
            $facets[] = $facet_id;
            foreach ($questions as $question) {
                if ($question["id"] == $question_id) {
                   $body = $body . "* " . $question["name"] . " -- ";
                   foreach ($question["choices"] as $choice) {
                        if ($choice["id"] == $facet_id) {
                            $body  = $body . $choice["name"] . "\r\n";
                        }
                   }
                }
            }
        }

        $body = $body . "\r\nYour resulting choices were:\r\n";

        $services = $this->createtestservicelist();

        foreach ($sdata as $svc) {
            foreach ($services as $service) {
                if ($service["id"] == $svc) {
                    $body = $body . "* "  . $service["title"] . "\r\n";
                }
            }
        }

        $body = $body . "\r\nUse this link to return to the tool ".
                "with your criteria already selected: " .
                \Drupal::request()->getSchemeAndHttpHost() .
                "/finder?facets=" .
                implode($facets,",") .
                "\r\n\r\n" .
                "If you have any further questions or need more information about " .
                "Finder services, please contact the helpdesk to set up a consultation, ".
                "or contact the service owners " .
                "directly (contact details in tool comparison table).\r\n\r\n";

        $subject = "Assistance request from Finder application";

        $mailManager = \Drupal::service('plugin.manager.mail');
        $module = "finder";
        $key = 'complete_form';

        $to = $decoded['email'];
        $params['message'] = $body;
        $params['subject'] = "ABC";

        \Drupal::logger('finder')->notice("to is $to");
        \Drupal::logger('finder')->notice("message is {$params['message']}");

        //$params['node_title'] = $entity->label();

        $langcode = \Drupal::currentUser()->getPreferredLangcode();
        $send = true;
        $result = $mailManager->mail($module, $key, $to, $langcode, $params, NULL, $send);

        if ($result['result'] !== true) {
          drupal_set_message(t('There was a problem sending your message and it was not sent.'), 'error');
          return new JsonResponse("problem");
        }
        else {
          drupal_set_message(t('Your message has been sent.'));
          return new JsonResponse("success");
        }

    }

    public function configuration() {
        if (\Drupal::service('session')->isStarted() === FALSE) {
            \Drupal::service('session')->start();
            \Drupal::service('session')->set('foo', 'bar');
        }
        \Drupal::logger('finder')->notice("starting session.");

        $config = \Drupal::service('config.factory')->getEditable("finder.settings");
        $data = [];
        $data["title"] = $config->get("title");
        $data["subtitle"] = $config->get("subtitle");
        $data["question_header"] = $config->get("question_header");
        $data["service_header"] = $config->get("service_header");
        $data["chart_header"] = $config->get("chart_header");
        $data["email_form_header"] = $config->get("email_form_header");
        $data["email_address"] = $config->get("email_address");
        $data["email_name"] = $config->get("email_name");
        $data["main_header"] = $config->get("main_header");
        $data["button_select_all"] = $config->get("button_select_all");
        $data["button_clear_selections"] = $config->get("button_clear_selections");
        return new JsonResponse($data);

    }

    private function get_web_page($url) {
    $options = array(
        CURLOPT_RETURNTRANSFER => true,   // return web page
        CURLOPT_HEADER         => false,  // don't return headers
        CURLOPT_FOLLOWLOCATION => true,   // follow redirects
        CURLOPT_MAXREDIRS      => 10,     // stop after 10 redirects
        CURLOPT_ENCODING       => "",     // handle compressed
        CURLOPT_USERAGENT      => "test", // name of client
        CURLOPT_AUTOREFERER    => true,   // set referrer on redirect
        CURLOPT_CONNECTTIMEOUT => 120,    // time-out on connect
        CURLOPT_TIMEOUT        => 120,    // time-out on response
    ); 

    $ch = curl_init($url);
    curl_setopt_array($ch, $options);

    $content  = curl_exec($ch);

    curl_close($ch);

    return $content;
    }


}
